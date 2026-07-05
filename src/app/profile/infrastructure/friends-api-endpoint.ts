import { HttpClient, HttpParams } from '@angular/common/http';
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

  getByUser(userId: number, status?: string): Observable<Friend[]> {
    let params = new HttpParams().set('user_id', userId);
    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<FriendResponse | FriendResource[]>(this.endpointUrl, { params }).pipe(
      map((response) => {
        if (Array.isArray(response)) {
          return response.map((resource) => this.assembler.toEntityFromResource(resource));
        }
        return this.assembler.toEntitiesFromResponse(response);
      }),
      catchError(this.handleError('Failed to fetch friend relationships')),
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
