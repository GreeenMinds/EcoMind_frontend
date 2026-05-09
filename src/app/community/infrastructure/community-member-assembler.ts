import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { CommunityMember } from '../domain/model/community-member.entity';
import { CommunityMemberResource, CommunityMemberResponse } from './community-member-response';

export class CommunityMemberAssembler implements BaseAssembler<
  CommunityMember,
  CommunityMemberResource,
  CommunityMemberResponse
> {
  toEntitiesFromResponse(response: CommunityMemberResponse): CommunityMember[] {
    return response.users.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: CommunityMemberResource): CommunityMember {
    const member = new CommunityMember();
    member.id = resource.id;
    member.community_id = resource.community_id;
    member.email = resource.email;
    member.birth_date = resource.birth_date;
    member.name = resource.name;
    member.streak = resource.streak;
    member.commitment = resource.commitment;
    member.registered_at = resource.registered_at;
    member.gem_balance = resource.gem_balance;
    member.ecopoints = resource.ecopoints;
    return member;
  }

  toResourceFromEntity(entity: CommunityMember): CommunityMemberResource {
    return {
      id: entity.id,
      community_id: entity.community_id,
      email: entity.email,
      birth_date: entity.birth_date,
      name: entity.name,
      streak: entity.streak,
      commitment: entity.commitment,
      registered_at: entity.registered_at,
      gem_balance: entity.gem_balance,
      ecopoints: entity.ecopoints,
    };
  }
}
