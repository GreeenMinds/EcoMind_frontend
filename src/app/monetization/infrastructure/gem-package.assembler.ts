import { BaseAssembler } from '../../shared/infrastructure/base-assembler';

import { GemPackageEntity } from '../domain/gem-package.entity';
import { GemPackagesResponse } from './gem-packages-response';

export class GemPackageAssembler
  implements BaseAssembler<GemPackageEntity, any, GemPackagesResponse>
{

  toEntityFromResource(resource: any): GemPackageEntity {
    return {
      id: resource.package_id,
      name: resource.name,
      gemAmount: resource.gem_amount,
      realPrice: resource.real_price,
      currency: resource.currency,
    };
  }

  toEntitiesFromResponse(
    response: GemPackagesResponse,
  ): GemPackageEntity[] {

    return response.gem_package.map(
      (resource) => this.toEntityFromResource(resource),
    );
  }

  toResourceFromEntity(entity: GemPackageEntity): any {
    return {
      package_id: entity.id,
      name: entity.name,
      gem_amount: entity.gemAmount,
      real_price: entity.realPrice,
      currency: entity.currency,
    };
  }
}
