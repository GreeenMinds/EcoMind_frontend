import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface CommunityPostResponse extends BaseResponse {
  communityPosts: CommunityPostResource[];
}

export interface CommunityPostResource extends BaseResource {
  id: number;
  community_id: number;
  user_id: number;
  content: string;
  points: number;
  likes: number;
  image_url: string | null;
  created_at: string;
}
