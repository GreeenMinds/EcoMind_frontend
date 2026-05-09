import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Community } from '../domain/model/community.entity';
import { CommunityResource, CommunityResponse } from './community-response';

export class CommunityAssembler implements BaseAssembler<
  Community,
  CommunityResource,
  CommunityResponse
> {
  toEntitiesFromResponse(response: CommunityResponse): Community[] {
    return response.communities.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: CommunityResource): Community {
    const community = new Community();
    community.id = resource.id;
    community.name = resource.name;
    community.user_count = resource.user_count;
    community.location = resource.location;
    return community;
  }

  toResourceFromEntity(entity: Community): CommunityResource {
    return {
      id: entity.id,
      name: entity.name,
      user_count: entity.user_count,
      location: entity.location,
    };
  }
}
