import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { CommunityPostReactionType } from '../domain/model/community-post-reaction.entity';

export interface CommunityPostReactionResponse extends BaseResponse {
  postReactions: CommunityPostReactionResource[];
}

export interface CommunityPostReactionResource extends BaseResource {
  id: number;
  post_id: number;
  user_id: number;
  reaction_type: CommunityPostReactionType;
  created_at: string;
}
