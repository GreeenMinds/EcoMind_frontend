import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface CommunityGoalResponse extends BaseResponse {
  communityGoals: CommunityGoalResource[];
}

export interface CommunityGoalResource extends BaseResource {
  id: number;
  community_id: number;
  goal_id: number;
  description: string;
  target: number;
  progress: number;
  participants: number;
  status: string;
}
