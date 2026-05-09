import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface UserAchievementResponse extends BaseResponse {
  userAchievements: UserAchievementResource[];
}

export interface UserAchievementResource extends BaseResource {
  id: number;
  achievement_id: number;
  user_id: number;
  date: string;
}
