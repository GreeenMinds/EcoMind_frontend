import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface UserResponse extends BaseResponse {
  users: UserResource[];
}

export interface UserResource extends BaseResource {
  id: number;
  community_id: number;
  email: string;
  birth_date: string;
  name: string;
  streak: number;
  commitment: string | null;
  registered_at: string;
  gem_balance: number;
  ecopoints: number;
}
