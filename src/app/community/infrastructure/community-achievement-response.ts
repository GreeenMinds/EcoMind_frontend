import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface CommunityAchievementResponse extends BaseResponse {
  communityAchievements: CommunityAchievementResource[];
}

export interface CommunityAchievementResource extends BaseResource {
  id: number;
  community_id: number;
  achievement_id: number;
  date: string;
}
