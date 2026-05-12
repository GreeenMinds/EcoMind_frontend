import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface CommunityGoalResponse extends BaseResponse {
  communityGoals: CommunityGoalResource[];
}

export interface CommunityGoalResource extends BaseResource {
  id: number;
  community_id: number;
  title: string;
  target: number;
  progress: number;
  unit: string;
  participants: number;
  status: string;
}
