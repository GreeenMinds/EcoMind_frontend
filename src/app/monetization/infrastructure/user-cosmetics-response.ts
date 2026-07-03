import { BaseResponse } from '../../shared/infrastructure/base-response';

export interface UserCosmeticsResponse extends BaseResponse {
  user_cosmetic: {
    id: number;
    user_id: number;
    cosmetic_id: number;
    acquired_at: string;
    equipped: boolean;
  }[];
}

