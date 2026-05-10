import { computed, DestroyRef, inject, Injectable, Signal, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, retry } from 'rxjs';
import { CurrentUser } from '../../shared/application/current-user';
import { MonetizationApi } from '../infrastructure/monetization-api';
import { CosmeticEntity }       from '../domain/cosmetic.entity';
import { MultiplierEntity }     from '../domain/multiplier.entity';
import { GemPackageEntity }     from '../domain/gem-package.entity';
import { UserCosmeticEntity }   from '../domain/user-cosmetic.entity';
import { UserMultiplierEntity } from '../domain/user-multiplier.entity';
import { GemPurchaseEntity }    from '../domain/gem.purchase.entity';
import { GemMovementEntity }    from '../domain/gem.movement.entity';

// ─── Interfaces de dominio ────────────────────────────────────────────────────

export interface CosmeticSummary {
  cosmetic: CosmeticEntity;
  owned: boolean;
  equipped: boolean;
  userRecord?: UserCosmeticEntity;
}

export interface MultiplierSummary {
  multiplier: MultiplierEntity;
  active: boolean;
  userRecord?: UserMultiplierEntity;
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class MonetizationStoreService {

  private readonly destroyRef       = inject(DestroyRef);
  private readonly monetizationApi  = inject(MonetizationApi);
  private readonly currentUser      = inject(CurrentUser);

  // ─── Signals privados ────────────────────────────────────────────────────

  private readonly cosmeticsSignal        = signal<CosmeticEntity[]>([]);
  private readonly multipliersSignal      = signal<MultiplierEntity[]>([]);
  private readonly gemPackagesSignal      = signal<GemPackageEntity[]>([]);
  private readonly userCosmeticsSignal    = signal<UserCosmeticEntity[]>([]);
  private readonly userMultipliersSignal  = signal<UserMultiplierEntity[]>([]);
  private readonly gemBalanceSignal       = signal<number>(0);
  private readonly loadingSignal          = signal<boolean>(false);
  private readonly errorSignal            = signal<string | null>(null);

  /** Timer para auto-limpiar el error */
  private errorClearTimer: ReturnType<typeof setTimeout> | null = null;

  // ─── Signals públicos (readonly) ─────────────────────────────────────────

  readonly cosmetics        = this.cosmeticsSignal.asReadonly();
  readonly multipliers      = this.multipliersSignal.asReadonly();
  readonly gemPackages      = this.gemPackagesSignal.asReadonly();
  readonly userCosmetics    = this.userCosmeticsSignal.asReadonly();
  readonly userMultipliers  = this.userMultipliersSignal.asReadonly();
  readonly gemBalance       = this.gemBalanceSignal.asReadonly();
  readonly loading          = this.loadingSignal.asReadonly();
  readonly error            = this.errorSignal.asReadonly();

  // ─── Computed ────────────────────────────────────────────────────────────

  readonly currentUserId = computed(() => this.currentUser.getCurrentUserId());

  readonly ownedCosmeticIds = computed(() =>
    new Set(this.userCosmetics().map((uc) => uc.cosmeticId)),
  );

  readonly equippedCosmeticIds = computed(() =>
    new Set(
      this.userCosmetics()
        .filter((uc) => uc.equipped)
        .map((uc) => uc.cosmeticId),
    ),
  );

  readonly activeMultiplierIds = computed(() =>
    new Set(this.userMultipliers().map((um) => um.multiplierId)),
  );

  readonly cosmeticSummaries: Signal<CosmeticSummary[]> = computed(() =>
    this.cosmetics().map((cosmetic) => ({
      cosmetic,
      owned:    this.ownedCosmeticIds().has(cosmetic.id),
      equipped: this.equippedCosmeticIds().has(cosmetic.id),
      userRecord: this.userCosmetics().find((uc) => uc.cosmeticId === cosmetic.id),
    })),
  );

  readonly inventorySummaries: Signal<CosmeticSummary[]> = computed(() =>
    this.cosmeticSummaries().filter((s) => s.owned),
  );

  readonly multiplierSummaries: Signal<MultiplierSummary[]> = computed(() =>
    this.multipliers().map((multiplier) => ({
      multiplier,
      active:     this.activeMultiplierIds().has(multiplier.id),
      userRecord: this.userMultipliers().find((um) => um.multiplierId === multiplier.id),
    })),
  );

  constructor() {
    this.loadData();
  }

  // ─── CARGA INICIAL ────────────────────────────────────────────────────────

  refresh(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    forkJoin({
      cosmetics:       this.monetizationApi.getCosmetics(),
      multipliers:     this.monetizationApi.getMultipliers(),
      gemPackages:     this.monetizationApi.getGemPackages(),
      userCosmetics:   this.monetizationApi.getUserCosmetics(),
      userMultipliers: this.monetizationApi.getUserMultipliers(),
      gemBalance:      this.monetizationApi.getUserGemBalance(this.currentUserId()),
    })
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.cosmeticsSignal.set(data.cosmetics);
          this.multipliersSignal.set(data.multipliers);
          this.gemPackagesSignal.set(data.gemPackages);
          this.userCosmeticsSignal.set(
            data.userCosmetics.filter((uc) => uc.userId === this.currentUserId()),
          );
          this.userMultipliersSignal.set(
            data.userMultipliers.filter((um) => um.userId === this.currentUserId()),
          );
          this.gemBalanceSignal.set(data.gemBalance);
          this.loadingSignal.set(false);
        },
        error: (err) => {
          this.setError(this.formatError(err, 'Error al cargar la tienda'));
          this.loadingSignal.set(false);
        },
      });
  }

  // ─── COMPRAR COSMÉTICO ────────────────────────────────────────────────────

  purchaseCosmetic(cosmetic: CosmeticEntity): void {

    if (this.ownedCosmeticIds().has(cosmetic.id)) {
      this.setError('Este artículo ya está en tu inventario.');
      return;
    }

    if (this.gemBalance() < cosmetic.price) {
      this.setError(
        `Insufficient gems. You need ${cosmetic.price} gems but you only have ${this.gemBalance()} .`,
      );
      return;
    }

    const newBalance = this.gemBalance() - cosmetic.price;

    const userCosmetic = new UserCosmeticEntity();
    userCosmetic.userId     = this.currentUserId();
    userCosmetic.cosmeticId = cosmetic.id;
    userCosmetic.acquiredAt = this.today();
    userCosmetic.equipped   = false;

    this.loadingSignal.set(true);
    this.monetizationApi
      .purchaseCosmetic(userCosmetic)
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (created) => {
          this.userCosmeticsSignal.update((list) => [...list, created]);
          this.updateBalance(newBalance);
          this.recordMovement('spend', -cosmetic.price, 'cosmetic', cosmetic.id);
          this.errorSignal.set(null);
          this.loadingSignal.set(false);
        },
        error: (err) => {
          this.setError(this.formatError(err, 'Error processing purchase'));
          this.loadingSignal.set(false);
        },
      });
  }

  // ─── EQUIPAR / DESEQUIPAR ─────────────────────────────────────────────────

  toggleEquip(summary: CosmeticSummary): void {

    if (!summary.owned || !summary.userRecord) {
      this.setError('You must obtain this item first.');
      return;
    }

    const isEquipping  = !summary.userRecord.equipped;
    const cosmeticType = summary.cosmetic.type; // 'avatar', 'hat', etc.

    // Si va a equipar, buscar el que ya esté equipado del mismo tipo
    const currentlyEquipped = isEquipping
      ? this.cosmeticSummaries().find(
        (s) => s.equipped && s.cosmetic.type === cosmeticType && s.userRecord
      )
      : null;

    const updated: UserCosmeticEntity = {
      ...summary.userRecord,
      equipped: isEquipping,
    };

    // Primero desequipamos el anterior del mismo tipo (si existe)
    if (currentlyEquipped?.userRecord) {
      const toUnequip: UserCosmeticEntity = {
        ...currentlyEquipped.userRecord,
        equipped: false,
      };
      this.monetizationApi
        .equipCosmetic(toUnequip)
        .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            this.userCosmeticsSignal.update((list) =>
              list.map((uc) => (uc.cosmeticId === res.cosmeticId ? res : uc)),
            );
          },
          error: (err) => {
            this.setError(this.formatError(err, 'Error unequipping the previous item'));
          },
        });
    }

    // Luego equipamos/desequipamos el nuevo
    this.monetizationApi
      .equipCosmetic(updated)
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.userCosmeticsSignal.update((list) =>
            list.map((uc) => (uc.cosmeticId === res.cosmeticId ? res : uc)),
          );
          this.errorSignal.set(null);
        },
        error: (err) => {
          this.setError(this.formatError(err, 'Error equipping the item'));
        },
      });
  }

  // ─── COMPRAR MULTIPLICADOR ────────────────────────────────────────────────

  purchaseMultiplier(multiplier: MultiplierEntity): void {

    if (this.gemBalance() < multiplier.gemCost) {
      this.setError(
        `Insufficient gems. You need ${multiplier.gemCost} gems but you only have ${this.gemBalance()} .`,
      );
      return;
    }

    const newBalance = this.gemBalance() - multiplier.gemCost;

    const userMultiplier = new UserMultiplierEntity();
    userMultiplier.userId       = this.currentUserId();
    userMultiplier.multiplierId = multiplier.id;
    userMultiplier.startDate    = new Date().toISOString();
    const end = new Date();
    end.setMinutes(end.getMinutes() + multiplier.durationMinutes);
    userMultiplier.endDate = end.toISOString();

    this.loadingSignal.set(true);
    this.monetizationApi
      .purchaseMultiplier(userMultiplier)
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (created) => {
          this.userMultipliersSignal.update((list) => [...list, created]);
          this.updateBalance(newBalance);
          this.recordMovement('spend', -multiplier.gemCost, 'multiplier', multiplier.id);
          this.errorSignal.set(null);
          this.loadingSignal.set(false);
        },
        error: (err) => {
          this.setError(this.formatError(err, 'Error al activar el multiplicador'));
          this.loadingSignal.set(false);
        },
      });
  }

  purchaseGemPackage(gemPackage: GemPackageEntity): void {

    const purchase = new GemPurchaseEntity();
    purchase.userId           = this.currentUserId();
    purchase.packageId        = gemPackage.id;
    purchase.purchaseDate     = this.today();
    purchase.amountPaid       = gemPackage.realPrice;
    purchase.paymentStatus    = 'approved';
    purchase.paymentReference = `PAY-${Date.now()}`;

    this.loadingSignal.set(true);
    this.monetizationApi
      .purchaseGemPackage(purchase)
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const newBalance = this.gemBalance() + gemPackage.gemAmount;
          this.updateBalance(newBalance);
          this.recordMovement('purchase', gemPackage.gemAmount, 'gem_package', gemPackage.id);

          if (gemPackage.id === 5) {
            this.giftSpecialPackageRewards();
          } else {
            this.loadingSignal.set(false);
          }
          this.errorSignal.set(null);
        },
        error: (err) => {
          this.setError(this.formatError(err, 'Error processing payment'));
          this.loadingSignal.set(false);
        },
      });
  }

  // ─── HELPERS PRIVADOS ─────────────────────────────────────────────────────

  /**
   * Setea el error y lo limpia automáticamente después de 4 segundos.
   * Cancela cualquier timer previo para evitar limpiezas anticipadas.
   */
  private setError(message: string): void {
    // Cancelar timer anterior si existe
    if (this.errorClearTimer) {
      clearTimeout(this.errorClearTimer);
    }
    this.errorSignal.set(message);
    // Programar limpieza automática
    this.errorClearTimer = setTimeout(() => {
      this.errorSignal.set(null);
      this.errorClearTimer = null;
    }, 4000);
  }

  private updateBalance(newBalance: number): void {
    this.gemBalanceSignal.set(newBalance);
    this.monetizationApi
      .updateUserGemBalance(this.currentUserId(), newBalance)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  private recordMovement(
    type: string, amount: number, origin: string, originId: number,
  ): void {
    const movement = new GemMovementEntity();
    movement.userId   = this.currentUserId();
    movement.type     = type;
    movement.amount   = amount;
    movement.origin   = origin;
    movement.originId = originId;

    this.monetizationApi
      .registerGemMovement(movement)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private formatError(error: unknown, fallback: string): string {
    if (error instanceof Error) {
      return error.message.includes('Resource not found')
        ? `${fallback}: Not found`
        : error.message;
    }
    return fallback;
  }

  private giftSpecialPackageRewards(): void {
    const userId = this.currentUserId();

    const avatarIds = [9, 10, 11];
    const avatarRequests = avatarIds.map(id => {
      const gift = new UserCosmeticEntity();
      gift.userId = userId;
      gift.cosmeticId = id;
      gift.acquiredAt = this.today();
      gift.equipped = false;
      return this.monetizationApi.purchaseCosmetic(gift);
    });

    const multiplierGift = new UserMultiplierEntity();
    multiplierGift.userId = userId;
    multiplierGift.multiplierId = 3;
    multiplierGift.startDate = new Date().toISOString();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    multiplierGift.endDate = endDate.toISOString();

    const multiplierRequest = this.monetizationApi.purchaseMultiplier(multiplierGift);

    forkJoin([...avatarRequests, multiplierRequest])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadData();
          console.log('Special package delivered!');
        },
        complete: () => this.loadingSignal.set(false),
      });
  }
}
