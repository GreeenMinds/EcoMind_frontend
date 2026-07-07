import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface CommunityAchievementResponse extends BaseResponse {
  communityAchievements: CommunityAchievementResource[];
}

export interface CommunityAchievementResource extends BaseResource {
  id: number;
  communityId: number;
  achievementId: number;
  achievementName: string | null;
  achievementDescription: string | null;
  earnedAt: string;
  newlyUnlocked: boolean;
}
