import { BaseAssembler } from '../../shared/infrastructure/base-assembler';

import { GemMovementEntity } from '../domain/gem.movement.entity';
import { GemMovementsResponse } from './gem-movements-response';

export class GemMovementAssembler
  implements BaseAssembler<GemMovementEntity, any, GemMovementsResponse>
{

  toEntityFromResource(resource: any): GemMovementEntity {
    return {
      id: resource.movement_id,
      userId: resource.user_id,
      type: resource.type,
      amount: resource.amount,
      origin: resource.origin,
      originId: resource.origin_id,
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
      movement_id: entity.id,
      user_id: entity.userId,
      type: entity.type,
      amount: entity.amount,
      origin: entity.origin,
      origin_id: entity.originId,
    };
  }
}
