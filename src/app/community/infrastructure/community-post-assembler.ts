import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { CommunityPost } from '../domain/model/community-post.entity';
import { CommunityPostResource, CommunityPostResponse } from './community-post-response';

export class CommunityPostAssembler implements BaseAssembler<
  CommunityPost,
  CommunityPostResource,
  CommunityPostResponse
> {
  toEntitiesFromResponse(response: CommunityPostResponse): CommunityPost[] {
    return response.communityPosts.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: CommunityPostResource): CommunityPost {
    const post = new CommunityPost();
    post.id = resource.id;
    post.community_id = resource.community_id;
    post.user_id = resource.user_id;
    post.content = resource.content;
    post.points = resource.points;
    post.likes = resource.likes;
    post.image_url = resource.image_url;
    post.created_at = resource.created_at;
    return post;
  }

  toResourceFromEntity(entity: CommunityPost): CommunityPostResource {
    return {
      id: entity.id,
      community_id: entity.community_id,
      user_id: entity.user_id,
      content: entity.content,
      points: entity.points,
      likes: entity.likes,
      image_url: entity.image_url,
      created_at: entity.created_at,
    };
  }
}
