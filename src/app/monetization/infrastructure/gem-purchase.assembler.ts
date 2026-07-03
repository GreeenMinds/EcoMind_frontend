import { BaseAssembler } from '../../shared/infrastructure/base-assembler';

import { GemPurchaseEntity } from '../domain/gem.purchase.entity';

import { GemPurchasesResponse } from './gem-purchase-response';

export class GemPurchaseAssembler
  implements BaseAssembler<GemPurchaseEntity, any, GemPurchasesResponse>
{
  toEntityFromResource(resource: any): GemPurchaseEntity {
    return {
      id: resource.id,
      userId: resource.userId,
      packageId: resource.packageId,
      purchaseDate: resource.purchaseDate,
      amountPaid: resource.amountPaid,
      paymentStatus: resource.paymentStatus,
      paymentReference: resource.paymentReference,
    };
  }

  toResourceFromEntity(entity: GemPurchaseEntity): any {
    return {
      userId: entity.userId,
      packageId: entity.packageId,
      purchaseDate: entity.purchaseDate,
      amountPaid: entity.amountPaid,
      paymentStatus: entity.paymentStatus,
      paymentReference: entity.paymentReference,
    };
  }

  toEntitiesFromResponse(response: GemPurchasesResponse): GemPurchaseEntity[] {
    return response.gem_purchase.map((item) =>
      this.toEntityFromResource(item),
    );
  }
}
