import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { CommunityPostReaction } from '../domain/model/community-post-reaction.entity';
import {
  CommunityPostReactionResource,
  CommunityPostReactionResponse,
} from './community-post-reaction-response';

export class CommunityPostReactionAssembler
  implements
    BaseAssembler<
      CommunityPostReaction,
      CommunityPostReactionResource,
      CommunityPostReactionResponse
    >
{
  toEntitiesFromResponse(response: CommunityPostReactionResponse): CommunityPostReaction[] {
    return response.postReactions.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: CommunityPostReactionResource): CommunityPostReaction {
    const reaction = new CommunityPostReaction();
    reaction.id = resource.id;
    reaction.post_id = resource.post_id;
    reaction.user_id = resource.user_id;
    reaction.reaction_type = resource.reaction_type;
    reaction.created_at = resource.created_at;
    return reaction;
  }

  toResourceFromEntity(entity: CommunityPostReaction): CommunityPostReactionResource {
    return {
      id: entity.id,
      post_id: entity.post_id,
      user_id: entity.user_id,
      reaction_type: entity.reaction_type,
      created_at: entity.created_at,
    };
  }
}
