import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { User } from '../domain/model/user.entity';
import { UserResource, UserResponse } from './user-response';

export class UserAssembler implements BaseAssembler<User, UserResource, UserResponse> {
  toEntitiesFromResponse(response: UserResponse): User[] {
    return response.users.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: UserResource): User {
    const user = new User();
    user.id = resource.id;
    user.community_id = resource.community_id;
    user.email = resource.email;
    user.birth_date = resource.birth_date;
    user.name = resource.name;
    user.streak = resource.streak;
    user.commitment = resource.commitment;
    user.registered_at = resource.registered_at;
    user.gem_balance = resource.gem_balance;
    user.ecopoints = resource.ecopoints;
    user.last_streak_date = resource.last_streak_date ?? null;
    return user;
  }

  toResourceFromEntity(entity: User): UserResource {
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
      last_streak_date: entity.last_streak_date,
    };
  }
}
