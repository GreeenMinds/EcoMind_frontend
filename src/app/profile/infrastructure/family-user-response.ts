import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface FamilyUserResponse extends BaseResponse {
  familyUsers: FamilyUserResource[];
}

export interface FamilyUserResource extends BaseResource {
  id: number;
  user_id: number;
  family_id: number;
  family_role: string;
  joined_at: string;
}
