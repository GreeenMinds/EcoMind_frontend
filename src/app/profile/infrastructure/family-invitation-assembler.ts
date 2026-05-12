import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { FamilyInvitation } from '../domain/model/family-invitation.entity';
import {
  FamilyInvitationResource,
  FamilyInvitationResponse,
} from './family-invitation-response';

export class FamilyInvitationAssembler
  implements BaseAssembler<FamilyInvitation, FamilyInvitationResource, FamilyInvitationResponse>
{
  toEntitiesFromResponse(response: FamilyInvitationResponse): FamilyInvitation[] {
    return response.familyInvitations.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: FamilyInvitationResource): FamilyInvitation {
    const invitation = new FamilyInvitation();
    invitation.id = resource.id;
    invitation.family_id = resource.family_id;
    invitation.inviter_user_id = resource.inviter_user_id;
    invitation.invited_user_id = resource.invited_user_id;
    invitation.invited_role = resource.invited_role;
    invitation.status = resource.status;
    invitation.created_at = resource.created_at;
    invitation.responded_at = resource.responded_at ?? null;
    return invitation;
  }

  toResourceFromEntity(entity: FamilyInvitation): FamilyInvitationResource {
    return {
      id: entity.id,
      family_id: entity.family_id,
      inviter_user_id: entity.inviter_user_id,
      invited_user_id: entity.invited_user_id,
      invited_role: entity.invited_role,
      status: entity.status,
      created_at: entity.created_at,
      responded_at: entity.responded_at,
    };
  }
}
