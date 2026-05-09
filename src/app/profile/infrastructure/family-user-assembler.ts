import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { FamilyUser } from '../domain/model/family-user.entity';
import { FamilyUserResource, FamilyUserResponse } from './family-user-response';

export class FamilyUserAssembler implements BaseAssembler<
  FamilyUser,
  FamilyUserResource,
  FamilyUserResponse
> {
  toEntitiesFromResponse(response: FamilyUserResponse): FamilyUser[] {
    return response.familyUsers.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: FamilyUserResource): FamilyUser {
    const familyUser = new FamilyUser();
    familyUser.id = resource.id;
    familyUser.user_id = resource.user_id;
    familyUser.family_id = resource.family_id;
    familyUser.family_role = resource.family_role;
    familyUser.joined_at = resource.joined_at;
    return familyUser;
  }

  toResourceFromEntity(entity: FamilyUser): FamilyUserResource {
    return {
      id: entity.id,
      user_id: entity.user_id,
      family_id: entity.family_id,
      family_role: entity.family_role,
      joined_at: entity.joined_at,
    };
  }
}
