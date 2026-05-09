import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface CommunityResponse extends BaseResponse {
  communities: CommunityResource[];
}

export interface CommunityResource extends BaseResource {
  id: number;
  name: string;
  user_count: number;
  location: string;
}
