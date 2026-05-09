import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { UserAchievement } from '../domain/model/user-achievement.entity';
import { UserAchievementResource, UserAchievementResponse } from './user-achievement-response';

export class UserAchievementAssembler implements BaseAssembler<
  UserAchievement,
  UserAchievementResource,
  UserAchievementResponse
> {
  toEntitiesFromResponse(response: UserAchievementResponse): UserAchievement[] {
    return response.userAchievements.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: UserAchievementResource): UserAchievement {
    const userAchievement = new UserAchievement();
    userAchievement.id = resource.id;
    userAchievement.achievement_id = resource.achievement_id;
    userAchievement.user_id = resource.user_id;
    userAchievement.date = resource.date;
    return userAchievement;
  }

  toResourceFromEntity(entity: UserAchievement): UserAchievementResource {
    return {
      id: entity.id,
      achievement_id: entity.achievement_id,
      user_id: entity.user_id,
      date: entity.date,
    };
  }
}
