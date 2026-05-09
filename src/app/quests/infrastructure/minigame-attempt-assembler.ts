import {BaseAssembler} from '../../shared/infrastructure/base-assembler';
import {MinigameAttempt} from '../domain/model/minigame-attempt.entity';
import {MinigameAttemptResponse, MinigameAttemptResource} from './minigame-attempt-response';

export class MinigameAttemptAssembler implements BaseAssembler<MinigameAttempt, MinigameAttemptResource, MinigameAttemptResponse> {
  toEntitiesFromResponse(response: MinigameAttemptResponse): MinigameAttempt[] {
    return response.minigameAttempts.map((resource) => this.toEntityFromResource(resource as MinigameAttemptResource));
  }

  toEntityFromResource(resource: MinigameAttemptResource): MinigameAttempt {
    return new MinigameAttempt({
      id: resource.id,
      user_id: resource.user_id,
      quest_id: resource.quest_id,
      score: resource.score,
      status: resource.status,
      start_date: resource.start_date,
      end_date: resource.end_date,
      metadata: resource.metadata,
    });
  }

  toResourceFromEntity(entity: MinigameAttempt): MinigameAttemptResource {
    return {
      id: entity.id,
      user_id: entity.user_id,
      quest_id: entity.quest_id,
      score: entity.score,
      status: entity.status,
      start_date: entity.start_date,
      end_date: entity.end_date,
      metadata: entity.metadata,
    } as MinigameAttemptResource;
  }
}
