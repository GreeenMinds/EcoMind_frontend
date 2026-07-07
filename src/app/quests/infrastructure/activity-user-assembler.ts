import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { ActivityUser } from '../domain/model/activity-user.entity';
import { ActivityUserResponse, ActivityUserResource } from './activity-user-response';

export class ActivityUserAssembler
  implements BaseAssembler<ActivityUser, ActivityUserResource, ActivityUserResponse>
{
  toEntitiesFromResponse(response: ActivityUserResponse): ActivityUser[] {
    return response.activitiesUser.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: ActivityUserResource): ActivityUser {
    return new ActivityUser({
      id: resource.id,
      quest_user_id: resource.questUserId,
      user_id: 0,
      activity_id: resource.activityId,
      progress: resource.progress,
      end_date: resource.endDate,
      collaborative_session_id: resource.collaborativeSessionId ?? null,
    });
  }

  toResourceFromEntity(entity: ActivityUser): ActivityUserResource {
    return {
      id: entity.id,
      questUserId: entity.quest_user_id,
      activityId: entity.activity_id,
      progress: entity.progress,
      endDate: entity.end_date,
      activityDescription: null,
      activityConfiguration: null,
      collaborativeSessionId: entity.collaborative_session_id,
    };
  }
}
