import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export type FamilyInvitationStatus = 'pending' | 'accepted' | 'rejected';
export type FamilyInvitationRole = 'parent' | 'child';

export class FamilyInvitation implements BaseEntity {
  id: number;
  family_id: number;
  inviter_user_id: number;
  invited_user_id: number;
  invited_role: FamilyInvitationRole;
  status: FamilyInvitationStatus;
  created_at: string;
  responded_at: string | null;

  constructor() {
    this.id = 0;
    this.family_id = 0;
    this.inviter_user_id = 0;
    this.invited_user_id = 0;
    this.invited_role = 'child';
    this.status = 'pending';
    this.created_at = '';
    this.responded_at = null;
  }
}
