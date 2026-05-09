import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface AchievementResponse extends BaseResponse {
  achievements: AchievementResource[];
}

export interface AchievementResource extends BaseResource {
  id: number;
  name: string;
  description: string;
  type: string;
}
