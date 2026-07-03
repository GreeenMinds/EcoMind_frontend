import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { UserCosmeticEntity } from '../domain/user-cosmetic.entity';
import { UserCosmeticsResponse } from './user-cosmetics-response';

export class UserCosmeticAssembler
  implements BaseAssembler<UserCosmeticEntity, any, UserCosmeticsResponse>
{
  toEntityFromResource(resource: any): UserCosmeticEntity {
    return {
      id: resource.id,
      userId: resource.userId,
      cosmeticId: resource.cosmeticId,
      acquiredAt: resource.acquiredAt,
      equipped: resource.equipped,
    };
  }

  toResourceFromEntity(entity: UserCosmeticEntity): any {
    return {
      id: entity.id,
      userId: entity.userId,
      cosmeticId: entity.cosmeticId,
      acquiredAt: entity.acquiredAt,
      equipped: entity.equipped,
    };
  }

  toEntitiesFromResponse(response: UserCosmeticsResponse): UserCosmeticEntity[] {
    return response.user_cosmetic.map((item) => this.toEntityFromResource(item));
  }
}
