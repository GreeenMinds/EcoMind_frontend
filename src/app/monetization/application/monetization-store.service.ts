import { computed, DestroyRef, effect, inject, Injectable, Signal, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, retry, switchMap } from 'rxjs';
import { CurrentUser } from '../../shared/application/current-user';
import { IamService } from '../../iam/application/iam.service';
import { MonetizationApi } from '../infrastructure/monetization-api';
import { ProfileService } from '../../profile/application/profile.service';
import { CosmeticEntity }       from '../domain/cosmetic.entity';
import { MultiplierEntity }     from '../domain/multiplier.entity';
import { GemPackageEntity }     from '../domain/gem-package.entity';
import { UserCosmeticEntity }   from '../domain/user-cosmetic.entity';
import { UserMultiplierEntity } from '../domain/user-multiplier.entity';
import { GemMovementEntity }    from '../domain/gem.movement.entity';


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

@Injectable({ providedIn: 'root' })
export class MonetizationStoreService {

  private readonly destroyRef       = inject(DestroyRef);
  private readonly monetizationApi  = inject(MonetizationApi);
  private readonly currentUser      = inject(CurrentUser);
  private readonly iamService       = inject(IamService);
  private readonly profileService   = inject(ProfileService);
  private readonly cosmeticsSignal        = signal<CosmeticEntity[]>([]);
  private readonly multipliersSignal      = signal<MultiplierEntity[]>([]);
  private readonly gemPackagesSignal      = signal<GemPackageEntity[]>([]);
  private readonly userCosmeticsSignal    = signal<UserCosmeticEntity[]>([]);
  private readonly allUserCosmeticsSignal = signal<UserCosmeticEntity[]>([]);
  private readonly userMultipliersSignal  = signal<UserMultiplierEntity[]>([]);
  private readonly gemBalanceSignal       = signal<number>(0);
  private readonly loadingSignal          = signal<boolean>(false);
  private readonly errorSignal            = signal<string | null>(null);
  private errorClearTimer: ReturnType<typeof setTimeout> | null = null;
  readonly cosmetics        = this.cosmeticsSignal.asReadonly();
  readonly multipliers      = this.multipliersSignal.asReadonly();
  readonly gemPackages      = this.gemPackagesSignal.asReadonly();
  readonly userCosmetics    = this.userCosmeticsSignal.asReadonly();
  readonly allUserCosmetics = this.allUserCosmeticsSignal.asReadonly();
  readonly userMultipliers  = this.userMultipliersSignal.asReadonly();
  readonly gemBalance       = this.gemBalanceSignal.asReadonly();
  readonly loading          = this.loadingSignal.asReadonly();
  readonly error            = this.errorSignal.asReadonly();

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

  readonly activeMultiplierIds = computed(() => {
    const now = new Date();
    return new Set(
      this.userMultipliers()
        .filter((um) => new Date(um.endDate) > now)
        .map((um) => um.multiplierId),
    );
  });

  readonly activeMultiplierFactor = computed(() => {
    const now = new Date();
    const activeFactors = this.userMultipliers()
      .filter((um) => new Date(um.endDate) > now)
      .map((um) => this.multipliers().find((m) => m.id === um.multiplierId)?.multiplierFactor ?? 1);
    return activeFactors.length > 0 ? Math.max(...activeFactors) : 1;
  });

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
    effect(() => {
      const session = this.iamService.currentSession();

      if (!session) {
        this.clearUserState();
        return;
      }

      this.loadData(session.userId);
    });
  }
  refresh(): void {
    this.loadData(this.currentUserId());
  }

  refreshGemPackages(): void {
    this.monetizationApi
      .getGemPackages()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((packages) => this.gemPackagesSignal.set(packages));
  }

  refreshCosmetics(): void {
    this.monetizationApi
      .getCosmetics()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cosmetics) => this.cosmeticsSignal.set(cosmetics));
  }

  refreshMultipliers(): void {
    this.monetizationApi
      .getMultipliers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((multipliers) => this.multipliersSignal.set(multipliers));
  }

  private loadData(userId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    forkJoin({
      cosmetics:       this.monetizationApi.getCosmetics(),
      multipliers:     this.monetizationApi.getMultipliers(),
      gemPackages:     this.monetizationApi.getGemPackages(),
      userCosmetics:   this.monetizationApi.getUserCosmeticsByUser(userId),
      allUserCosmetics: this.monetizationApi.getUserCosmetics(),
      userMultipliers: this.monetizationApi.getUserMultipliersByUser(userId),
      gemBalance:      this.monetizationApi.getUserGemBalance(userId),
    })
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          if (this.iamService.currentSession()?.userId !== userId) {
            return;
          }

          this.cosmeticsSignal.set(data.cosmetics);
          this.multipliersSignal.set(data.multipliers);
          this.gemPackagesSignal.set(data.gemPackages);
          this.allUserCosmeticsSignal.set(data.allUserCosmetics);
          this.userCosmeticsSignal.set(data.userCosmetics);
          this.userMultipliersSignal.set(data.userMultipliers);

          this.gemBalanceSignal.set(data.gemBalance);
          this.profileService.syncGemBalance(data.gemBalance);
          this.loadingSignal.set(false);
        },
        error: (err) => {
          if (this.iamService.currentSession()?.userId !== userId) {
            return;
          }

          this.setError(this.formatError(err, 'Error loading store'));
          this.loadingSignal.set(false);
        },
      });
  }
  onQuestGemsAwarded(userId: number, amount: number, questId: number, newBalance: number): void {
    if (amount <= 0) return;

    const movement = new GemMovementEntity();
    movement.userId   = userId;
    movement.type     = 'quest_reward';
    movement.amount   = amount;
    movement.origin   = 'quest';
    movement.originId = questId;
    this.monetizationApi
      .registerGemMovement(movement)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    if (userId === this.currentUserId()) {
      this.gemBalanceSignal.set(newBalance);
      this.profileService.syncGemBalance(newBalance);
    }
  }

  purchaseCosmetic(cosmetic: CosmeticEntity): void {

    if (this.ownedCosmeticIds().has(cosmetic.id)) {
      this.setError('This item is already in your inventory.');
      return;
    }

    if (this.gemBalance() < cosmetic.price) {
      this.setError(
        `Insufficient gems. You need ${cosmetic.price} 💎 but you have ${this.gemBalance()} 💎.`,
      );
      return;
    }

    this.loadingSignal.set(true);
   this.monetizationApi
      .buyCosmetic(this.currentUserId(), cosmetic.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (created) => {
          if (created.userId !== this.currentUserId()) {
            this.setError('The purchase was assigned to a different user.');
            this.loadingSignal.set(false);
            return;
          }

          this.userCosmeticsSignal.update((list) => [...list, created]);
          this.allUserCosmeticsSignal.update((list) => [...list, created]);
          this.refreshBalance();
          this.errorSignal.set(null);
          this.loadingSignal.set(false);
        },
        error: (err) => {
          this.setError(this.formatError(err, 'Error processing purchase'));
          this.loadingSignal.set(false);
        },
      });
  }
  getEquippedAvatarUrlForUser(userId: number): string | null {
    const equippedIds = this.allUserCosmeticsSignal()
      .filter((uc) => uc.userId === userId && uc.equipped)
      .map((uc) => uc.cosmeticId);
    const avatar = this.cosmetics().find(
      (c) => equippedIds.includes(c.id) && c.type === 'avatar'
    );
    return avatar?.imageUrl ?? null;
  }

  getEquippedOverlayUrlForUser(userId: number): string | null {
    const equippedIds = this.allUserCosmeticsSignal()
      .filter((uc) => uc.userId === userId && uc.equipped)
      .map((uc) => uc.cosmeticId);
    const overlay = this.cosmetics().find(
      (c) => equippedIds.includes(c.id) && c.type !== 'avatar'
    );
    return overlay?.imageUrl ?? null;
  }

  getEquippedOverlayTypeForUser(userId: number): string | null {
    const equippedIds = this.allUserCosmeticsSignal()
      .filter((uc) => uc.userId === userId && uc.equipped)
      .map((uc) => uc.cosmeticId);
    const overlay = this.cosmetics().find(
      (c) => equippedIds.includes(c.id) && c.type !== 'avatar'
    );
    return overlay?.type ?? null;
  }

  toggleEquip(summary: CosmeticSummary): void {

    if (!summary.owned || !summary.userRecord) {
      this.setError('You must get this item first.');
      return;
    }

    const isEquipping = !summary.userRecord.equipped;
    const isAvatar = summary.cosmetic.type === 'avatar';

 const currentlyEquipped = isEquipping
      ? this.cosmeticSummaries().find((s) => {
        if (!s.equipped || !s.userRecord || s.cosmetic.id === summary.cosmetic.id) return false;
        const sIsAvatar = s.cosmetic.type === 'avatar';
        return isAvatar ? sIsAvatar : !sIsAvatar;
      })
      : null;

    const updated: UserCosmeticEntity = {
      ...summary.userRecord,
      equipped: isEquipping,
    };

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
              list.map((uc) => (uc.id === res.id ? res : uc)),
            );
            this.allUserCosmeticsSignal.update((list) =>
              list.map((uc) => (uc.id === res.id ? res : uc)),
            );
          },
          error: (err) => {
            this.setError(this.formatError(err, 'Error removing the previous item'));
          },
        });
    }

    this.monetizationApi
      .equipCosmetic(updated)
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.userCosmeticsSignal.update((list) =>
            list.map((uc) => (uc.id === res.id ? res : uc)),
          );
          this.allUserCosmeticsSignal.update((list) =>
            list.map((uc) => (uc.id === res.id ? res : uc)),
          );
          this.errorSignal.set(null);
        },
        error: (err) => {
          this.setError(this.formatError(err, 'Error equipping the item'));
        },
      });
  }

  purchaseMultiplier(multiplier: MultiplierEntity): void {

    if (this.gemBalance() < multiplier.gemCost) {
      this.setError(
        `Insufficient gems. You need ${multiplier.gemCost} 💎 but you have ${this.gemBalance()} 💎.`,
      );
      return;
    }

    this.loadingSignal.set(true);

    this.monetizationApi
      .buyMultiplier(this.currentUserId(), multiplier.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (created) => {
          this.userMultipliersSignal.update((list) => [...list, created]);
          this.refreshBalance();
          this.errorSignal.set(null);
          this.loadingSignal.set(false);
        },
        error: (err) => {
          this.setError(this.formatError(err, 'Error activating the multiplier'));
          this.loadingSignal.set(false);
        },
      });
  }

  finalizeGemPackagePurchase(gemPackage: GemPackageEntity): void {
    this.refreshBalance();

    if (gemPackage.gemAmount === 10000) {
      this.loadingSignal.set(true);
      this.giftSpecialPackageRewards();
    }
  }

  private setError(message: string): void {
    if (this.errorClearTimer) {
      clearTimeout(this.errorClearTimer);
    }
    this.errorSignal.set(message);
    this.errorClearTimer = setTimeout(() => {
      this.errorSignal.set(null);
      this.errorClearTimer = null;
    }, 4000);
  }
  private refreshBalance(): void {
    this.monetizationApi
      .getUserGemBalance(this.currentUserId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((balance) => {
        this.gemBalanceSignal.set(balance);
        this.profileService.syncGemBalance(balance);
      });
  }

  private today(): string {
    return this.toLocalDateTimeString(new Date());
  }

  private toLocalDateTimeString(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
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

    forkJoin({
      cosmetics: this.monetizationApi.getCosmetics(),
      userCosmetics: this.monetizationApi.getUserCosmeticsByUser(userId),
      multipliers: this.monetizationApi.getMultipliers(),
    })
      .pipe(
        switchMap(({ cosmetics, userCosmetics, multipliers }) => {
          const ownedIds = new Set(
            userCosmetics.map((uc) => uc.cosmeticId),
          );

          const avatarRequests = cosmetics
            .filter((cosmetic) => cosmetic.type === 'avatar' && !ownedIds.has(cosmetic.id))
            .slice(0, 3)
            .map((cosmetic) => {
              const gift = new UserCosmeticEntity();
              gift.userId = userId;
              gift.cosmeticId = cosmetic.id;
              gift.acquiredAt = this.today();
              gift.equipped = false;
              return this.monetizationApi.purchaseCosmetic(gift);
            });

          const bestMultiplier = [...multipliers].sort(
            (a, b) => b.multiplierFactor - a.multiplierFactor,
          )[0];

          const multiplierRequests = [];
          if (bestMultiplier) {
            const multiplierGift = new UserMultiplierEntity();
            multiplierGift.userId = userId;
            multiplierGift.multiplierId = bestMultiplier.id;
            multiplierGift.startDate = this.toLocalDateTimeString(new Date());
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 7);
            multiplierGift.endDate = this.toLocalDateTimeString(endDate);
            multiplierRequests.push(this.monetizationApi.purchaseMultiplier(multiplierGift));
          }

          return forkJoin([...avatarRequests, ...multiplierRequests]);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.loadData(this.currentUserId());
          console.log('¡Special package delivered!');
        },
        error: (err) => {
          this.setError(this.formatError(err, 'Error delivering Mega Bundle rewards'));
          this.loadingSignal.set(false);
        },
        complete: () => this.loadingSignal.set(false),
      });
  }

  private clearUserState(): void {
    this.userCosmeticsSignal.set([]);
    this.allUserCosmeticsSignal.set([]);
    this.userMultipliersSignal.set([]);
    this.gemBalanceSignal.set(0);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
  }
}
