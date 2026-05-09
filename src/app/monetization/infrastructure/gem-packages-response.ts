import { BaseResponse } from '../../shared/infrastructure/base-response';

export interface GemPackagesResponse extends BaseResponse {
  gem_package: {
    package_id: number;
    name: string;
    gem_amount: number;
    real_price: number;
    currency: string;
  }[];
}
