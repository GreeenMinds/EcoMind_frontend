import { BaseResponse } from '../../shared/infrastructure/base-response';

export interface CosmeticsResponse extends BaseResponse {
  cosmetic: {
    cosmetic_id: number;
    name: string;
    description: string;
    price: number;
    type: string;
    image_url: string;
  }[];
}
