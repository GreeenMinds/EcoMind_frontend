import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BaseApi } from '../../shared/infrastructure/base-api';

import { CosmeticEntity }       from '../domain/cosmetic.entity';
import { MultiplierEntity }     from '../domain/multiplier.entity';
import { GemPackageEntity }     from '../domain/gem-package.entity';
import { UserCosmeticEntity }   from '../domain/user-cosmetic.entity';
import { UserMultiplierEntity } from '../domain/user-multiplier.entity';
import { GemPurchaseEntity }    from '../domain/gem.purchase.entity';
import { GemMovementEntity }    from '../domain/gem.movement.entity';

import { CosmeticsApiEndpoint }       from './cosmetics-api.endpoint';
import { MultipliersApiEndpoint }     from './multipliers-api.endpoint';
import { GemPackagesApiEndpoint }     from './gem-packages-api.endpoint';
import { UserCosmeticsApiEndpoint }   from './user-cosmetics-api.endpoint';
import { UserMultipliersApiEndpoint } from './user-multipliers-api.endpoint';
import { GemPurchasesApiEndpoint }    from './gem-purchases-api.endpoint';
import { GemMovementsApiEndpoint }    from './gem-movements-api.endpoint';

@Injectable({ providedIn: 'root' })
export class MonetizationApi extends BaseApi {

  private readonly http              = inject(HttpClient);
  private readonly cosmeticsEndpoint = inject(CosmeticsApiEndpoint);
  private readonly multipliersEndpoint    = inject(MultipliersApiEndpoint);
  private readonly gemPackagesEndpoint    = inject(GemPackagesApiEndpoint);
  private readonly userCosmeticsEndpoint  = inject(UserCosmeticsApiEndpoint);
  private readonly userMultipliersEndpoint= inject(UserMultipliersApiEndpoint);
  private readonly gemPurchasesEndpoint   = inject(GemPurchasesApiEndpoint);
  private readonly gemMovementsEndpoint   = inject(GemMovementsApiEndpoint);

  private readonly userUrl =
    `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderUserEndpointPath}`;

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

  /** Creates gem_purchase record → purchase with real money (E1) */
  purchaseGemPackage(gemPurchase: GemPurchaseEntity): Observable<GemPurchaseEntity> {
    return this.gemPurchasesEndpoint.create(gemPurchase);
  }

  /** Registers movement in gem_movement */
  registerGemMovement(movement: GemMovementEntity): Observable<GemMovementEntity> {
    return this.gemMovementsEndpoint.create(movement);
  }
}
