import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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
      `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderFriendEndpointPath}`,
      new FriendAssembler(),
    );
  }

  accept(friendshipId: number): Observable<Friend> {
    return this.http.patch<FriendResource>(`${this.endpointUrl}/${friendshipId}/accept`, {}).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to accept friend request')),
    );
  }

  reject(friendshipId: number): Observable<Friend> {
    return this.http.patch<FriendResource>(`${this.endpointUrl}/${friendshipId}/reject`, {}).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to reject friend request')),
    );
  }
}
