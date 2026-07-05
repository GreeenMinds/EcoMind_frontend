import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Quest } from '../domain/model/quest.entity';
import { QuestResponse, QuestResource } from './quest-response';

export class QuestAssembler implements BaseAssembler<Quest, QuestResource, QuestResponse> {
  toEntitiesFromResponse(response: QuestResponse): Quest[] {
    return response.quests.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: QuestResource): Quest {
    return new Quest({
      id: resource.id,
      minigameId: resource.minigameId,
      category: resource.category,
      title: resource.title,
      description: resource.description,
      imageUrl: resource.image,
      age: resource.age,
      type: resource.type,
      themeType: resource.theme ?? resource.type,
      rewardGems: resource.gemReward,
      rewardEcopoints: resource.ecopoints,
      assignedDate: resource.assignedDate,
      time: resource.time,
    });
  }

  toResourceFromEntity(entity: Quest): QuestResource {
    return {
      id: entity.id,
      minigameId: entity.minigameId,
      category: entity.category,
      title: entity.title,
      description: entity.description,
      image: entity.imageUrl,
      age: entity.age,
      type: entity.type,
      theme: entity.themeType,
      gemReward: entity.rewardGems,
      ecopoints: entity.rewardEcopoints,
      assignedDate: entity.assignedDate,
      time: entity.time,
    };
  }
}
