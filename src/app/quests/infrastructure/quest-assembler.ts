import {BaseAssembler} from '../../shared/infrastructure/base-assembler';
import {Quest} from '../domain/model/quest.entity';
import {QuestResponse, QuestResource} from './quest-response';

export class QuestAssembler implements BaseAssembler<Quest, QuestResource, QuestResponse> {
  /**
   * Converts a QuestResponse to an array of Category entities.
   * @param response - The API response containing Quests.
   * @returns An array of Category entities.
   */
  toEntitiesFromResponse(response: QuestResponse): Quest[] {
    return response.quests.map((resource) => this.toEntityFromResource(resource as QuestResource));
  }

  /**
   * Converts a QuestResource to a Quest entity.
   * @param resource - The resource to convert.
   * @returns The converted Category entity.
   */
  toEntityFromResource(resource: QuestResource): Quest {
    return new Quest({
      id: resource.id,
      minigame_id: resource.minigame_id,
      category: resource.category,
      description: resource.description,
      type: resource.type,
      reward_gems: resource.reward_gems,
      reward_ecopoints: resource.reward_ecopoints,
      expiration_date: resource.expiration_date,
      time: resource.time,
    });
  }

  /**
   * Converts a Quest entity to a QuestResource.
   * @param entity - The entity to convert.
   * @returns The converted CategoryResource.
   */
  toResourceFromEntity(entity: Quest): QuestResource {
    return {
      id: entity.id,
      minigame_id: entity.minigame_id,
      category: entity.category,
      description: entity.description,
      type: entity.type,
      reward_gems: entity.reward_gems,
      reward_ecopoints: entity.reward_ecopoints,
      expiration_date: entity.expiration_date,
      time: entity.time,
    } as QuestResource;
  }
}
