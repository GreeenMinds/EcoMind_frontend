import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BaseApi } from '../../shared/infrastructure/base-api';

import { CosmeticEntity }       from '../domain/cosmetic.entity';
import { MultiplierEntity }     from '../domain/multiplier.entity';
import { GemPackageEntity }     from '../domain/gem-package.entity';
import { UserCosmeticEntity }   from '../domain/user-cosmetic.entity';
import { UserMultiplierEntity } from '../domain/user-multiplier.entity';
import { GemMovementEntity }    from '../domain/gem.movement.entity';

import { CosmeticsApiEndpoint }       from './cosmetics-api.endpoint';
import { MultipliersApiEndpoint }     from './multipliers-api.endpoint';
import { GemPackagesApiEndpoint }     from './gem-packages-api.endpoint';
import { UserCosmeticsApiEndpoint }   from './user-cosmetics-api.endpoint';
import { UserMultipliersApiEndpoint } from './user-multipliers-api.endpoint';
import { GemMovementsApiEndpoint }    from './gem-movements-api.endpoint';

@Injectable({ providedIn: 'root' })
export class MonetizationApi extends BaseApi {

  private readonly http              = inject(HttpClient);
  private readonly cosmeticsEndpoint = inject(CosmeticsApiEndpoint);
  private readonly multipliersEndpoint    = inject(MultipliersApiEndpoint);
  private readonly gemPackagesEndpoint    = inject(GemPackagesApiEndpoint);
  private readonly userCosmeticsEndpoint  = inject(UserCosmeticsApiEndpoint);
  private readonly userMultipliersEndpoint= inject(UserMultipliersApiEndpoint);
  private readonly gemMovementsEndpoint   = inject(GemMovementsApiEndpoint);

  private readonly userUrl =
    `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderUserEndpointPath}`;

  private readonly userCosmeticUrl =
    `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderUserCosmeticEndpointPath}`;

  private readonly userMultiplierUrl =
    `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderUserMultiplierEndpointPath}`;

  private readonly gemPurchaseUrl =
    `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderGemPurchaseEndpointPath}`;

  // ─── CATÁLOGO ─────────────────────────────────────────────────────────────

  getCosmetics(): Observable<CosmeticEntity[]> {
    return this.cosmeticsEndpoint.getAll();
  }

  getMultipliers(): Observable<MultiplierEntity[]> {
    return this.multipliersEndpoint.getAll();
  }

  getGemPackages(): Observable<GemPackageEntity[]> {
    return this.gemPackagesEndpoint.getAll();
  }

  // ─── USUARIO / BALANCE ────────────────────────────────────────────────────

  getUserGemBalance(userId: number): Observable<number> {
    return this.http
      .get<{ gem_balance: number }>(`${this.userUrl}/${userId}`)
      .pipe(map((user) => user.gem_balance));
  }

  /** PATCH gem_balance — no reemplaza todo el objeto (HU-035 E4) */
  updateUserGemBalance(userId: number, newBalance: number): Observable<void> {
    return this.http.patch<void>(
      `${this.userUrl}/${userId}`,
      { gem_balance: newBalance },
    );
  }

  // ─── INVENTARIO DEL USUARIO ───────────────────────────────────────────────

  getUserCosmetics(): Observable<UserCosmeticEntity[]> {
    return this.userCosmeticsEndpoint.getAll();
  }

  getUserMultipliers(): Observable<UserMultiplierEntity[]> {
    return this.userMultipliersEndpoint.getAll();
  }

  // ─── COMANDOS: COSMÉTICOS (HU-029) ───────────────────────────────────────

  /** Crea registro user_cosmetic → buy (E1) */
  purchaseCosmetic(userCosmetic: UserCosmeticEntity): Observable<UserCosmeticEntity> {
    return this.userCosmeticsEndpoint.create(userCosmetic);
  }

  /**
   * Atomic cosmetic purchase: the backend validates the gem balance, charges it,
   * creates the ownership record and records the SPEND movement in one transaction.
   */
  buyCosmetic(userId: number, cosmeticId: number): Observable<UserCosmeticEntity> {
    return this.http
      .post<any>(`${this.userCosmeticUrl}/purchase`, { userId, cosmeticId })
      .pipe(
        map((r) => ({
          id: r.id,
          userId: r.userId,
          cosmeticId: r.cosmeticId,
          acquiredAt: r.acquiredAt,
          equipped: r.equipped,
        })),
        catchError((err) => throwError(() => new Error(this.backendMessage(err)))),
      );
  }

  /**
   * Atomic multiplier purchase: the backend validates the gem balance, charges it,
   * activates the multiplier and records the SPEND movement in one transaction.
   */
  buyMultiplier(userId: number, multiplierId: number): Observable<UserMultiplierEntity> {
    return this.http
      .post<any>(`${this.userMultiplierUrl}/purchase`, { userId, multiplierId })
      .pipe(
        map((r) => ({
          id: r.id,
          userId: r.userId,
          multiplierId: r.multiplierId,
          startDate: r.startDate,
          endDate: r.endDate,
        })),
        catchError((err) => throwError(() => new Error(this.backendMessage(err)))),
      );
  }

  /** Extracts a readable message from a backend error response ({ code, message, details }). */
  private backendMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error;
      if (body && typeof body === 'object') {
        return body.details || body.message || `Request failed (${err.status})`;
      }
      return `Request failed (${err.status})`;
    }
    return 'Unexpected error';
  }

  /** PUT user_cosmetic/{id} → equipar / desequipar (E4) */
  equipCosmetic(userCosmetic: UserCosmeticEntity): Observable<UserCosmeticEntity> {
    return this.userCosmeticsEndpoint.update(userCosmetic, userCosmetic.id);
  }

  // COMANDOS: MULTIPLICADORES (HU-031)

  /** Creates user_multiplier record → activates multiplier (E1) */
  purchaseMultiplier(userMultiplier: UserMultiplierEntity): Observable<UserMultiplierEntity> {
    return this.userMultipliersEndpoint.create(userMultiplier);
  }

  // COMANDOS: GEMAS (HU-035)

  /**
   * Starts a real gem package checkout. The backend prices it server-side from the
   * GemPackage and creates the purchase in PENDING status.
   */
  checkoutGemPurchase(
    userId: number,
    packageId: number,
    paymentMethod: 'card' | 'yape' | 'paypal',
  ): Observable<any> {
    return this.http
      .post<any>(`${this.gemPurchaseUrl}/checkout`, { userId, packageId, paymentMethod })
      .pipe(catchError((err) => throwError(() => new Error(this.backendMessage(err)))));
  }

  /**
   * Pays a PENDING gem purchase. The backend resolves the right gateway (Culqi for
   * card/yape, PayPal for paypal) from the purchase's payment method, charges it and,
   * on approval, credits the gems and records the movement atomically.
   */
  payGemPurchase(gemPurchaseId: number, sourceToken: string, email: string): Observable<any> {
    return this.http
      .post<any>(`${this.gemPurchaseUrl}/${gemPurchaseId}/pay`, { sourceToken, email })
      .pipe(catchError((err) => throwError(() => new Error(this.backendMessage(err)))));
  }

  /**
   * Manually approves a PENDING gem purchase without going through a gateway charge.
   * Used only for Yape until its real Culqi tokenization flow is verified against docs.
   */
  approveGemPurchase(gemPurchaseId: number): Observable<any> {
    return this.http
      .patch<any>(`${this.gemPurchaseUrl}/${gemPurchaseId}/approve`, {})
      .pipe(catchError((err) => throwError(() => new Error(this.backendMessage(err)))));
  }

  tokenizeCulqiCard(card: {
    card_number: string;
    cvv: string;
    expiration_month: string;
    expiration_year: string;
    email: string;
  }): Observable<{ id: string }> {
    return this.http
      .post<{ id: string }>(`${this.gemPurchaseUrl}/tokenize`, card)
      .pipe(catchError((err) => throwError(() => new Error(this.backendMessage(err)))));
  }

  tokenizeCulqiYape(yape: {
    phone_number: string;
    otp: string;
    email: string;
  }): Observable<{ id: string }> {
    return this.http
      .post<{ id: string }>(`${this.gemPurchaseUrl}/tokenize`, yape)
      .pipe(catchError((err) => throwError(() => new Error(this.backendMessage(err)))));
  }

  /** Registers movement in gem_movement */
  registerGemMovement(movement: GemMovementEntity): Observable<GemMovementEntity> {
    return this.gemMovementsEndpoint.create(movement);
  }
}
