import { BaseResponse } from '../../shared/infrastructure/base-response';

export interface MultipliersResponse extends BaseResponse {
  multiplier: {
    id: number;
    multiplier_factor: number;
    duration_minutes: number;
    gem_cost: number;
  }[];
}
