import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {BaseApiEndpoint} from '../../shared/infrastructure/base-api-endpoint';
import {CollaborativeQuestSession} from '../domain/model/collaborative-quest-session.entity';
import {CollaborativeQuestSessionAssembler} from './collaborative-quest-session-assembler';
import {
  CollaborativeQuestCountersResource,
  CollaborativeQuestPermissionsResource,
  CollaborativeQuestSessionStateResource,
  CreateCollaborativeQuestSessionPayload,
  CollaborativeQuestSessionResource,
  CollaborativeQuestSessionResponse,
} from './collaborative-quest-session-response';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CollaborativeQuestMember } from '../domain/model/collaborative-quest-member.entity';
import { CollaborativeQuestMemberAssembler } from './collaborative-quest-member-assembler';

export class CollaborativeQuestSessionsApiEndpoint extends BaseApiEndpoint<
  CollaborativeQuestSession,
  CollaborativeQuestSessionResource,
  CollaborativeQuestSessionResponse,
  CollaborativeQuestSessionAssembler
> {
  private readonly memberAssembler = new CollaborativeQuestMemberAssembler();

  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderCollaborativeQuestSessionEndpointPath}`,
      new CollaborativeQuestSessionAssembler(),
    );
  }

  createSession(
    payload: CreateCollaborativeQuestSessionPayload,
  ): Observable<CollaborativeQuestSession> {
    return this.http.post<CollaborativeQuestSessionResource>(this.endpointUrl, payload).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to create collaborative quest session')),
    );
  }

  startSession(sessionId: number, ownerUserId: number): Observable<CollaborativeQuestSession> {
    return this.http
      .post<CollaborativeQuestSessionResource>(
        `${this.endpointUrl}/${sessionId}/start`,
        {},
        { params: { ownerUserId } },
      )
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError(this.handleError('Failed to start collaborative quest session')),
      );
  }

  deletePendingSession(sessionId: number, ownerUserId: number): Observable<void> {
    return this.http
      .delete<void>(`${this.endpointUrl}/${sessionId}`, { params: { ownerUserId } })
      .pipe(catchError(this.handleError('Failed to delete collaborative quest session')));
  }

  getState(
    questId: number,
    userId: number,
  ): Observable<{
    session: CollaborativeQuestSession | null;
    members: CollaborativeQuestMember[];
    currentMember: CollaborativeQuestMember | null;
    pendingInvitation: CollaborativeQuestMember | null;
    permissions: CollaborativeQuestPermissionsResource;
    counters: CollaborativeQuestCountersResource;
  }> {
    return this.http
      .get<CollaborativeQuestSessionStateResource>(`${this.endpointUrl}/state`, {
        params: { questId, userId },
      })
      .pipe(
        map((resource) => ({
          session: resource.session
            ? this.assembler.toEntityFromResource(resource.session)
            : null,
          members: resource.members.map((member) =>
            this.memberAssembler.toEntityFromResource(member),
          ),
          currentMember: resource.currentMember
            ? this.memberAssembler.toEntityFromResource(resource.currentMember)
            : null,
          pendingInvitation: resource.pendingInvitation
            ? this.memberAssembler.toEntityFromResource(resource.pendingInvitation)
            : null,
          permissions: resource.permissions,
          counters: resource.counters,
        })),
        catchError(this.handleError('Failed to fetch collaborative quest state')),
      );
  }
}
