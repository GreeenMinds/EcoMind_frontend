import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Friend } from '../domain/model/friend.entity';
import { FriendAssembler } from './friend-assembler';
import { FriendResource, FriendResponse } from './friend-response';

export class FriendsApiEndpoint extends BaseApiEndpoint<
  Friend,
  FriendResource,
  FriendResponse,
  FriendAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderFriendEndpointPath}`,
      new FriendAssembler(),
    );
  }
}
