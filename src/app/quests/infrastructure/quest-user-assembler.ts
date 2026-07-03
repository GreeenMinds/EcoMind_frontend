import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { QuestUser } from '../domain/model/quest-user.entity';
import { QuestUserResponse, QuestUserResource } from './quest-user-response';

export class QuestUserAssembler
  implements BaseAssembler<QuestUser, QuestUserResource, QuestUserResponse>
{
  toEntitiesFromResponse(response: QuestUserResponse): QuestUser[] {
    return response.questsUser.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: QuestUserResource): QuestUser {
    return new QuestUser({
      id: resource.id,
      user_id: resource.userId,
      quest_id: resource.questId,
      status: resource.status,
      progress: resource.progress,
      start_date: '',
      end_date: resource.endDate,
      collaborative_session_id: resource.collaborativeSessionId ?? null,
    });
  }

  toResourceFromEntity(entity: QuestUser): QuestUserResource {
    return {
      id: entity.id,
      userId: entity.user_id,
      questId: entity.quest_id,
      status: entity.status,
      progress: entity.progress,
      endDate: entity.end_date,
      collaborativeSessionId: entity.collaborative_session_id,
    };
  }
}
