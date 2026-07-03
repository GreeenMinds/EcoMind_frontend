import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { MinigameAttempt } from '../domain/model/minigame-attempt.entity';
import { MinigameAttemptResponse, MinigameAttemptResource } from './minigame-attempt-response';

export class MinigameAttemptAssembler
  implements BaseAssembler<MinigameAttempt, MinigameAttemptResource, MinigameAttemptResponse>
{
  toEntitiesFromResponse(response: MinigameAttemptResponse): MinigameAttempt[] {
    return response.minigameAttempts.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: MinigameAttemptResource): MinigameAttempt {
    return new MinigameAttempt({
      id: resource.id,
      userId: resource.userId,
      questId: resource.questId,
      score: resource.score,
      status: resource.status,
      startDate: resource.startDate,
      endDate: resource.endDate,
      metadata: resource.metadata,
      givenGems: resource.givenGems,
      givenEcopoints: resource.givenEcopoints,
    });
  }

  toResourceFromEntity(entity: MinigameAttempt): MinigameAttemptResource {
    return {
      id: entity.id,
      userId: entity.userId,
      questId: entity.questId,
      score: entity.score,
      status: entity.status,
      startDate: entity.startDate,
      endDate: entity.endDate,
      metadata: entity.metadata,
      givenGems: entity.givenGems,
      givenEcopoints: entity.givenEcopoints,
    };
  }
}
