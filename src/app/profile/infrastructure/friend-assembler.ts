import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Friend } from '../domain/model/friend.entity';
import { FriendResource, FriendResponse } from './friend-response';

export class FriendAssembler implements BaseAssembler<Friend, FriendResource, FriendResponse> {
  toEntitiesFromResponse(response: FriendResponse): Friend[] {
    return response.friends.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: FriendResource): Friend {
    const friend = new Friend();
    friend.id = resource.id;
    friend.user_id = resource.user_id;
    friend.friend_id = resource.friend_id;
    friend.status = resource.status;
    return friend;
  }

  toResourceFromEntity(entity: Friend): FriendResource {
    return {
      id: entity.id,
      user_id: entity.user_id,
      friend_id: entity.friend_id,
      status: entity.status,
    };
  }
}
