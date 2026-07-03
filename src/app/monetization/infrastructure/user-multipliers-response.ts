import { BaseResponse } from '../../shared/infrastructure/base-response';

export interface UserMultipliersResponse extends BaseResponse {
  user_multiplier: {
    id: number;
    multiplier_id: number;
    user_id: number;
    start_date: string;
    end_date: string;
  }[];
}
