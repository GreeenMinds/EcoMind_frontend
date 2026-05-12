import { BaseEntity } from '../../shared/infrastructure/base-entity';
export class GemPurchaseEntity implements BaseEntity {
  id: number;
  userId: number;
  packageId: number;
  purchaseDate: string;
  amountPaid: number;
  paymentStatus: string;
  paymentReference: string;

  constructor() {
    this.id = 0;
    this.userId = 0;
    this.packageId = 0;
    this.purchaseDate = '';
    this.amountPaid = 0;
    this.paymentStatus = '';
    this.paymentReference = '';
  }
}
