import {BaseAssembler} from '../../shared/infrastructure/base-assembler';
import {Activity} from '../domain/model/activity.entity';
import {ActivityResponse, ActivityResource} from './activity-response';

export class ActivityAssembler implements BaseAssembler<Activity, ActivityResource, ActivityResponse> {
  toEntitiesFromResponse(response: ActivityResponse): Activity[] {
    return response.activities.map((resource) => this.toEntityFromResource(resource as ActivityResource));
  }

  toEntityFromResource(resource: ActivityResource): Activity {
    return new Activity({
      id: resource.id,
      quest_id: resource.quest_id,
      description: resource.description,
      order: resource.order,
      type: resource.type,
      image_url: resource.image_url,
    });
  }

  toResourceFromEntity(entity: Activity): ActivityResource {
    return {
      id: entity.id,
      quest_id: entity.quest_id,
      description: entity.description,
      order: entity.order,
      type: entity.type,
      image_url: entity.image_url,
    } as ActivityResource;
  }
}
