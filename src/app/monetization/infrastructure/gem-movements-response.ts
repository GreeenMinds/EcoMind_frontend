import { BaseResponse } from '../../shared/infrastructure/base-response';

export interface GemMovementsResponse extends BaseResponse {
  gem_movement: {
    movement_id: number;
    user_id: number;
    type: string;
    amount: number;
    origin: string;
    origin_id: number;
  }[];
}
