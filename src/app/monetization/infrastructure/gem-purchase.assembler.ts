import { BaseAssembler } from '../../shared/infrastructure/base-assembler';

import { GemPurchaseEntity } from '../domain/gem.purchase.entity';

import { GemPurchasesResponse } from './gem-purchase-response';

export class GemPurchaseAssembler
  implements BaseAssembler<GemPurchaseEntity, any, GemPurchasesResponse>
{
  toEntityFromResource(resource: any): GemPurchaseEntity {
    return {
      id: resource.id,
      userId: resource.user_id,
      packageId: resource.package_id,
      purchaseDate: resource.purchase_date,
      amountPaid: resource.amount_paid,
      paymentStatus: resource.payment_status,
      paymentReference: resource.payment_reference,
    };
  }

  toResourceFromEntity(entity: GemPurchaseEntity): any {
    return {
      id: entity.id,
      user_id: entity.userId,
      package_id: entity.packageId,
      purchase_date: entity.purchaseDate,
      amount_paid: entity.amountPaid,
      payment_status: entity.paymentStatus,
      payment_reference: entity.paymentReference,
    };
  }

  toEntitiesFromResponse(response: GemPurchasesResponse): GemPurchaseEntity[] {
    return response.gem_purchase.map((item) =>
      this.toEntityFromResource(item),
    );
  }
}
