import {BaseAssembler} from '../../shared/infrastructure/base-assembler';
import {CollaborativeQuestSession} from '../domain/model/collaborative-quest-session.entity';
import {
  CollaborativeQuestSessionResource,
  CollaborativeQuestSessionResponse,
} from './collaborative-quest-session-response';

export class CollaborativeQuestSessionAssembler
  implements
    BaseAssembler<
      CollaborativeQuestSession,
      CollaborativeQuestSessionResource,
      CollaborativeQuestSessionResponse
    >
{
  toEntitiesFromResponse(response: CollaborativeQuestSessionResponse): CollaborativeQuestSession[] {
    return response.collaborativeQuestSessions.map((resource) =>
      this.toEntityFromResource(resource),
    );
  }

  toEntityFromResource(resource: CollaborativeQuestSessionResource): CollaborativeQuestSession {
    return new CollaborativeQuestSession({
      id: resource.id,
      quest_id: resource.quest_id,
      owner_user_id: resource.owner_user_id,
      status: resource.status,
      created_at: resource.created_at,
      started_at: resource.started_at,
      completed_at: resource.completed_at,
    });
  }

  toResourceFromEntity(entity: CollaborativeQuestSession): CollaborativeQuestSessionResource {
    return {
      id: entity.id,
      quest_id: entity.quest_id,
      owner_user_id: entity.owner_user_id,
      status: entity.status,
      created_at: entity.created_at,
      started_at: entity.started_at,
      completed_at: entity.completed_at,
    };
  }
}
