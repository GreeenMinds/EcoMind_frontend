import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { FamilyInvitationRole, FamilyInvitationStatus } from '../domain/model/family-invitation.entity';

export interface FamilyInvitationResponse extends BaseResponse {
  familyInvitations: FamilyInvitationResource[];
}

export interface FamilyInvitationResource extends BaseResource {
  id: number;
  family_id: number;
  inviter_user_id: number;
  invited_user_id: number;
  invited_role: FamilyInvitationRole;
  status: FamilyInvitationStatus;
  created_at: string;
  responded_at?: string | null;
}
