import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface UserAchievementResponse extends BaseResponse {
  userAchievements: UserAchievementResource[];
}

export interface UserAchievementResource extends BaseResource {
  id: number;
  achievementId: number;
  userId: number;
  achievementName: string | null;
  achievementDescription: string | null;
  earnedAt: string;
  newlyUnlocked: boolean;
}
