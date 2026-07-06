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
    userAchievement.achievement_id = resource.achievementId;
    userAchievement.user_id = resource.userId;
    userAchievement.date = resource.earnedAt;
    userAchievement.achievement_name = resource.achievementName ?? '';
    userAchievement.achievement_description = resource.achievementDescription ?? '';
    userAchievement.newly_unlocked = resource.newlyUnlocked;
    return userAchievement;
  }

  toResourceFromEntity(entity: UserAchievement): UserAchievementResource {
    return {
      id: entity.id,
      achievementId: entity.achievement_id,
      userId: entity.user_id,
      achievementName: entity.achievement_name,
      achievementDescription: entity.achievement_description,
      earnedAt: entity.date,
      newlyUnlocked: entity.newly_unlocked,
    };
  }
}
