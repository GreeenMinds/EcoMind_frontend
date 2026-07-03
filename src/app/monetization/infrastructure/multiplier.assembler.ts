import { BaseAssembler } from '../../shared/infrastructure/base-assembler';

import { MultiplierEntity } from '../domain/multiplier.entity';
import { MultipliersResponse } from './multipliers-response';

export class MultiplierAssembler
  implements BaseAssembler<MultiplierEntity, any, MultipliersResponse>
{

  toEntityFromResource(resource: any): MultiplierEntity {
    return {
      id: resource.id,
      multiplierFactor: resource.multiplierFactor,
      durationMinutes: resource.durationMinutes,
      gemCost: resource.gemCost,
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
      multiplierFactor: entity.multiplierFactor,
      durationMinutes: entity.durationMinutes,
      gemCost: entity.gemCost,
    };
  }
}
