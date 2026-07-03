import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {BaseApiEndpoint} from '../../shared/infrastructure/base-api-endpoint';
import {CollaborativeQuestMember} from '../domain/model/collaborative-quest-member.entity';
import {CollaborativeQuestMemberAssembler} from './collaborative-quest-member-assembler';
import {
  InviteCollaborativeQuestMemberPayload,
  CollaborativeQuestMemberResource,
  CollaborativeQuestMemberResponse,
} from './collaborative-quest-member-response';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export class CollaborativeQuestMembersApiEndpoint extends BaseApiEndpoint<
  CollaborativeQuestMember,
  CollaborativeQuestMemberResource,
  CollaborativeQuestMemberResponse,
  CollaborativeQuestMemberAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderCollaborativeQuestMemberEndpointPath}`,
      new CollaborativeQuestMemberAssembler(),
    );
  }

  invite(payload: InviteCollaborativeQuestMemberPayload): Observable<CollaborativeQuestMember> {
    return this.http.post<CollaborativeQuestMemberResource>(this.endpointUrl, payload).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to invite collaborative quest member')),
    );
  }

  accept(memberId: number): Observable<CollaborativeQuestMember> {
    return this.patchMember(memberId, 'accept', 'Failed to accept collaborative quest invitation');
  }

  decline(memberId: number): Observable<CollaborativeQuestMember> {
    return this.patchMember(memberId, 'decline', 'Failed to decline collaborative quest invitation');
  }

  leave(memberId: number): Observable<CollaborativeQuestMember> {
    return this.patchMember(memberId, 'leave', 'Failed to leave collaborative quest');
  }

  remove(memberId: number, ownerUserId: number): Observable<CollaborativeQuestMember> {
    return this.http
      .patch<CollaborativeQuestMemberResource>(
        `${this.endpointUrl}/${memberId}/remove`,
        {},
        { params: { ownerUserId } },
      )
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError(this.handleError('Failed to remove collaborative quest member')),
      );
  }

  private patchMember(
    memberId: number,
    action: string,
    errorMessage: string,
  ): Observable<CollaborativeQuestMember> {
    return this.http
      .patch<CollaborativeQuestMemberResource>(`${this.endpointUrl}/${memberId}/${action}`, {})
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError(this.handleError(errorMessage)),
      );
  }
}
