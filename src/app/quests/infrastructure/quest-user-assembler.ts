import {BaseAssembler} from '../../shared/infrastructure/base-assembler';
import {QuestUser} from '../domain/model/quest-user.entity';
import {QuestUserResponse, QuestUserResource} from './quest-user-response';

export class QuestUserAssembler implements BaseAssembler<QuestUser, QuestUserResource, QuestUserResponse> {
  toEntitiesFromResponse(response: QuestUserResponse): QuestUser[] {
    return response.questsUser.map((resource) => this.toEntityFromResource(resource as QuestUserResource));
  }

  toEntityFromResource(resource: QuestUserResource): QuestUser {
    return new QuestUser({
      id: resource.id,
      user_id: resource.user_id,
      quest_id: resource.quest_id,
      status: resource.status,
      progress: resource.progress,
      start_date: resource.start_date,
      end_date: resource.end_date,
    });
  }

  toResourceFromEntity(entity: QuestUser): QuestUserResource {
    return {
      id: entity.id,
      user_id: entity.user_id,
      quest_id: entity.quest_id,
      status: entity.status,
      progress: entity.progress,
      start_date: entity.start_date,
      end_date: entity.end_date,
    } as QuestUserResource;
  }
}
