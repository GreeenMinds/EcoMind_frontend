import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { CosmeticEntity } from '../domain/cosmetic.entity';
import { CosmeticsResponse } from './cosmetics-response';

export class CosmeticAssembler
  implements BaseAssembler<CosmeticEntity, any, CosmeticsResponse>
{
  toEntityFromResource(resource: any): CosmeticEntity {
    return {
      id: resource.id,
      name: resource.name,
      description: resource.description,
      price: resource.price,
      type: resource.type,
      imageUrl: resource.image_url,
    };
  }

  toEntitiesFromResponse(
    response: CosmeticsResponse,
  ): CosmeticEntity[] {
    return response.cosmetic.map(
      (resource) => this.toEntityFromResource(resource),
    );
  }

  toResourceFromEntity(entity: CosmeticEntity): any {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      price: entity.price,
      type: entity.type,
      image_url: entity.imageUrl,
    };
  }
}
