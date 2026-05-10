import {BaseAssembler} from '../../shared/infrastructure/base-assembler';
import {CollaborativeQuestMember} from '../domain/model/collaborative-quest-member.entity';
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
      session_id: resource.session_id,
      user_id: resource.user_id,
      invited_by_user_id: resource.invited_by_user_id,
      role: resource.role,
      status: resource.status,
      invited_at: resource.invited_at,
      responded_at: resource.responded_at,
      left_at: resource.left_at,
      removed_at: resource.removed_at,
    });
  }

  toResourceFromEntity(entity: CollaborativeQuestMember): CollaborativeQuestMemberResource {
    return {
      id: entity.id,
      session_id: entity.session_id,
      user_id: entity.user_id,
      invited_by_user_id: entity.invited_by_user_id,
      role: entity.role,
      status: entity.status,
      invited_at: entity.invited_at,
      responded_at: entity.responded_at,
      left_at: entity.left_at,
      removed_at: entity.removed_at,
    };
  }
}
