import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { UserMultiplierEntity } from '../domain/user-multiplier.entity';
import { UserMultipliersResponse } from './user-multipliers-response';

export class UserMultiplierAssembler
  implements BaseAssembler<UserMultiplierEntity, any, UserMultipliersResponse>
{
  toEntityFromResource(resource: any): UserMultiplierEntity {
    return {
      id: resource.id,
      multiplierId: resource.multiplierId ?? resource.multiplier_id,
      userId: resource.userId ?? resource.user_id,
      startDate: resource.startDate ?? resource.start_date,
      endDate: resource.endDate ?? resource.end_date,
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
