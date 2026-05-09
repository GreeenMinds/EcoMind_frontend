import { BaseAssembler } from '../../shared/infrastructure/base-assembler';

import { MultiplierEntity } from '../domain/multiplier.entity';
import { MultipliersResponse } from './multipliers-response';

export class MultiplierAssembler
  implements BaseAssembler<MultiplierEntity, any, MultipliersResponse>
{

  toEntityFromResource(resource: any): MultiplierEntity {
    return {
      id: resource.id,
      multiplierFactor: resource.multiplier_factor,
      durationMinutes: resource.duration_minutes,
      gemCost: resource.gem_cost,
    };
  }

  toEntitiesFromResponse(
    response: MultipliersResponse,
  ): MultiplierEntity[] {

    return response.multiplier.map(
      (resource) => this.toEntityFromResource(resource),
    );
  }

  toResourceFromEntity(entity: MultiplierEntity): any {
    return {
      id: entity.id,
      multiplier_factor: entity.multiplierFactor,
      duration_minutes: entity.durationMinutes,
      gem_cost: entity.gemCost,
    };
  }
}
