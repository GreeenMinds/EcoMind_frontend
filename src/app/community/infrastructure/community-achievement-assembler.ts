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
    communityAchievement.community_id = resource.community_id;
    communityAchievement.achievement_id = resource.achievement_id;
    communityAchievement.date = resource.date;
    return communityAchievement;
  }

  toResourceFromEntity(entity: CommunityAchievement): CommunityAchievementResource {
    return {
      id: entity.id,
      community_id: entity.community_id,
      achievement_id: entity.achievement_id,
      date: entity.date,
    };
  }
}
