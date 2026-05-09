import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface FriendResponse extends BaseResponse {
  friends: FriendResource[];
}

export interface FriendResource extends BaseResource {
  id: number;
  user_id: number;
  friend_id: number;
  status: string;
}
