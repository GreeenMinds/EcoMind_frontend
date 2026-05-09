import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Achievement } from '../domain/model/achievement.entity';
import { AchievementResource, AchievementResponse } from './achievement-response';

export class AchievementAssembler implements BaseAssembler<
  Achievement,
  AchievementResource,
  AchievementResponse
> {
  toEntitiesFromResponse(response: AchievementResponse): Achievement[] {
    return response.achievements.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: AchievementResource): Achievement {
    const achievement = new Achievement();
    achievement.id = resource.id;
    achievement.name = resource.name;
    achievement.description = resource.description;
    achievement.type = resource.type;
    return achievement;
  }

  toResourceFromEntity(entity: Achievement): AchievementResource {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      type: entity.type,
    };
  }
}
