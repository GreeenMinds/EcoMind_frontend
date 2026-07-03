import { BaseAssembler } from '../../shared/infrastructure/base-assembler';

import { GemMovementEntity } from '../domain/gem.movement.entity';
import { GemMovementsResponse } from './gem-movements-response';

export class GemMovementAssembler
  implements BaseAssembler<GemMovementEntity, any, GemMovementsResponse>
{

  toEntityFromResource(resource: any): GemMovementEntity {
    return {
      id: resource.id,
      userId: resource.userId,
      type: resource.type,
      amount: resource.amount,
      origin: resource.origin,
      originId: resource.originId,
    };
  }

  toEntitiesFromResponse(
    response: GemMovementsResponse,
  ): GemMovementEntity[] {

    return response.gem_movement.map(
      (resource) => this.toEntityFromResource(resource),
    );
  }

  toResourceFromEntity(entity: GemMovementEntity): any {
    return {
      userId: entity.userId,
      type: entity.type,
      amount: entity.amount,
      origin: entity.origin,
      originId: entity.originId,
    };
  }
}
