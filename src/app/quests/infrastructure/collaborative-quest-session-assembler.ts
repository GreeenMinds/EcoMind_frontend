import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { CollaborativeQuestSession } from '../domain/model/collaborative-quest-session.entity';
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
      quest_id: resource.questId,
      owner_user_id: resource.ownerUserId,
      status: resource.status,
      created_at: resource.createdAt,
      started_at: resource.startedAt,
      completed_at: resource.completedAt,
    });
  }

  toResourceFromEntity(entity: CollaborativeQuestSession): CollaborativeQuestSessionResource {
    return {
      id: entity.id,
      questId: entity.quest_id,
      ownerUserId: entity.owner_user_id,
      status: entity.status,
      createdAt: entity.created_at,
      startedAt: entity.started_at,
      completedAt: entity.completed_at,
    };
  }
}
