import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { CollaborativeQuestMember } from '../domain/model/collaborative-quest-member.entity';
import {
  CollaborativeQuestMemberResource,
  CollaborativeQuestMemberResponse,
} from './collaborative-quest-member-response';

export class CollaborativeQuestMemberAssembler
  implements
    BaseAssembler<
      CollaborativeQuestMember,
      CollaborativeQuestMemberResource,
      CollaborativeQuestMemberResponse
    >
{
  toEntitiesFromResponse(response: CollaborativeQuestMemberResponse): CollaborativeQuestMember[] {
    return response.collaborativeQuestMembers.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: CollaborativeQuestMemberResource): CollaborativeQuestMember {
    return new CollaborativeQuestMember({
      id: resource.id,
      session_id: resource.sessionId,
      user_id: resource.userId,
      invited_by_user_id: resource.ownerId,
      role: resource.role,
      status: resource.status,
      invited_at: null,
      responded_at: resource.answerDate,
      left_at: resource.revokeDate,
      removed_at: resource.revokeDate,
    });
  }

  toResourceFromEntity(entity: CollaborativeQuestMember): CollaborativeQuestMemberResource {
    return {
      id: entity.id,
      sessionId: entity.session_id,
      userId: entity.user_id,
      ownerId: entity.invited_by_user_id,
      role: entity.role,
      status: entity.status,
      answerDate: entity.responded_at,
      revokeDate: entity.left_at ?? entity.removed_at,
    };
  }
}
