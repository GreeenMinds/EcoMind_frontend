import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { UserMultiplierEntity } from '../domain/user-multiplier.entity';
import { UserMultipliersResponse } from './user-multipliers-response';

export class UserMultiplierAssembler
  implements BaseAssembler<UserMultiplierEntity, any, UserMultipliersResponse>
{
  toEntityFromResource(resource: any): UserMultiplierEntity {
    return {
      id: resource.id,
      multiplierId: resource.multiplierId,
      userId: resource.userId,
      startDate: resource.startDate,
      endDate: resource.endDate,
    };
  }

  toResourceFromEntity(entity: UserMultiplierEntity): any {
    return {
      id: entity.id,
      multiplierId: entity.multiplierId,
      userId: entity.userId,
      startDate: entity.startDate,
      endDate: entity.endDate,
    };
  }

  toEntitiesFromResponse(response: UserMultipliersResponse): UserMultiplierEntity[] {
    return response.user_multiplier.map((item) => this.toEntityFromResource(item));
  }
}
