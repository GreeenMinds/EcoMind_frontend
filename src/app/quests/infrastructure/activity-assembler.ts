import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Activity } from '../domain/model/activity.entity';
import { ActivityResponse, ActivityResource } from './activity-response';

export class ActivityAssembler implements BaseAssembler<Activity, ActivityResource, ActivityResponse> {
  toEntitiesFromResponse(response: ActivityResponse): Activity[] {
    return response.activities.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: ActivityResource): Activity {
    return new Activity({
      id: resource.id,
      quest_id: resource.questId,
      description: resource.description,
      order: resource.order,
      type: resource.type,
      image_url: resource.image,
    });
  }

  toResourceFromEntity(entity: Activity): ActivityResource {
    return {
      id: entity.id,
      questId: entity.quest_id,
      description: entity.description,
      order: entity.order,
      type: entity.type,
      activityConfiguration: null,
      image: entity.image_url,
    };
  }
}
