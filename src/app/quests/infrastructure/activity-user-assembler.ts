import {BaseAssembler} from '../../shared/infrastructure/base-assembler';
import {ActivityUser} from '../domain/model/activity-user.entity';
import {ActivityUserResponse, ActivityUserResource} from './activity-user-response';

export class ActivityUserAssembler implements BaseAssembler<ActivityUser, ActivityUserResource, ActivityUserResponse> {
  toEntitiesFromResponse(response: ActivityUserResponse): ActivityUser[] {
    return response.activitiesUser.map((resource) => this.toEntityFromResource(resource as ActivityUserResource));
  }

  toEntityFromResource(resource: ActivityUserResource): ActivityUser {
    return new ActivityUser({
      id: resource.id,
      user_id: resource.user_id,
      activity_id: resource.activity_id,
      progress: resource.progress,
      end_date: resource.end_date,
    });
  }

  toResourceFromEntity(entity: ActivityUser): ActivityUserResource {
    return {
      id: entity.id,
      user_id: entity.user_id,
      activity_id: entity.activity_id,
      progress: entity.progress,
      end_date: entity.end_date,
    } as ActivityUserResource;
  }
}
