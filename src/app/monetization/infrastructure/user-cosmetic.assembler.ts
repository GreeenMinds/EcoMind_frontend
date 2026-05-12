import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { UserCosmeticEntity } from '../domain/user-cosmetic.entity';
import { UserCosmeticsResponse } from './user-cosmetics-response';

export class UserCosmeticAssembler
  implements BaseAssembler<UserCosmeticEntity, any, UserCosmeticsResponse>
{
  toEntityFromResource(resource: any): UserCosmeticEntity {
    return {
      id: resource.id,               // ← ID real del registro en DB
      userId: resource.user_id,
      cosmeticId: resource.cosmetic_id,
      acquiredAt: resource.acquired_at,
      equipped: resource.equipped,
    };
  }

  toResourceFromEntity(entity: UserCosmeticEntity): any {
    return {
      id: entity.id,
      user_id: entity.userId,
      cosmetic_id: entity.cosmeticId,
      acquired_at: entity.acquiredAt,
      equipped: entity.equipped,
    };
  }

  toEntitiesFromResponse(response: UserCosmeticsResponse): UserCosmeticEntity[] {
    return response.user_cosmetic.map((item) => this.toEntityFromResource(item));
  }
}
