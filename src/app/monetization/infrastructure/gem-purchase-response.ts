import { BaseResponse } from '../../shared/infrastructure/base-response';

export interface GemPurchasesResponse extends BaseResponse {
  gem_purchase: {
    id: number;
    user_id: number;
    package_id: number;
    purchase_date: string;
    amount_paid: number;
    payment_status: string;
    payment_reference: string;
  }[];
}
