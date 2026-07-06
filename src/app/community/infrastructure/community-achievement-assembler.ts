import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { CommunityAchievement } from '../domain/model/community-achievement.entity';
import { CommunityAchievementResource, CommunityAchievementResponse} from './community-achievement-response';

export class CommunityAchievementAssembler implements BaseAssembler<
  CommunityAchievement,
  CommunityAchievementResource,
  CommunityAchievementResponse
> {
  toEntitiesFromResponse(response: CommunityAchievementResponse): CommunityAchievement[] {
    return response.communityAchievements.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: CommunityAchievementResource): CommunityAchievement {
    const communityAchievement = new CommunityAchievement();
    communityAchievement.id = resource.id;
    communityAchievement.community_id = resource.communityId;
    communityAchievement.achievement_id = resource.achievementId;
    communityAchievement.date = resource.earnedAt;
    communityAchievement.achievement_name = resource.achievementName ?? '';
    communityAchievement.achievement_description = resource.achievementDescription ?? '';
    communityAchievement.newly_unlocked = resource.newlyUnlocked;
    return communityAchievement;
  }

  toResourceFromEntity(entity: CommunityAchievement): CommunityAchievementResource {
    return {
      id: entity.id,
      communityId: entity.community_id,
      achievementId: entity.achievement_id,
      achievementName: entity.achievement_name,
      achievementDescription: entity.achievement_description,
      earnedAt: entity.date,
      newlyUnlocked: entity.newly_unlocked,
    };
  }
}
