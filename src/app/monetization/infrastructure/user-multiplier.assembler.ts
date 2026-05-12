import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { UserMultiplierEntity } from '../domain/user-multiplier.entity';
import { UserMultipliersResponse } from './user-multipliers-response';

export class UserMultiplierAssembler
  implements BaseAssembler<UserMultiplierEntity, any, UserMultipliersResponse>
{
  toEntityFromResource(resource: any): UserMultiplierEntity {
    return {
      id: resource.id,               // ← ID real del registro en DB
      multiplierId: resource.multiplier_id,
      userId: resource.user_id,
      startDate: resource.start_date,
      endDate: resource.end_date,
    };
  }

  toResourceFromEntity(entity: UserMultiplierEntity): any {
    return {
      id: entity.id,
      multiplier_id: entity.multiplierId,
      user_id: entity.userId,
      start_date: entity.startDate,
      end_date: entity.endDate,
    };
  }

  toEntitiesFromResponse(response: UserMultipliersResponse): UserMultiplierEntity[] {
    return response.user_multiplier.map((item) => this.toEntityFromResource(item));
  }
}
