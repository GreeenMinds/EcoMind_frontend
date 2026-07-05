import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {BaseApiEndpoint} from '../../shared/infrastructure/base-api-endpoint';
import {QuestUser} from '../domain/model/quest-user.entity';
import {QuestUserAssembler} from './quest-user-assembler';
import {QuestUserResponse, QuestUserResource} from './quest-user-response';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

type CreateQuestUserResource = {
  userId: number;
  questId: number;
  collaborativeSessionId: number | null;
};

export class QuestsUserApiEndpoint extends BaseApiEndpoint<
  QuestUser,
  QuestUserResource,
  QuestUserResponse,
  QuestUserAssembler
> {
  /**
   * Creates an instance of QuestsUserApiEndpoint.
   * @param http - The HttpClient to be used for making API requests.
   */
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderUserQuestEndpointPath}`,
      new QuestUserAssembler(),
    );
  }

  override create(questUser: QuestUser): Observable<QuestUser> {
    const resource: CreateQuestUserResource = {
      userId: questUser.user_id,
      questId: questUser.quest_id,
      collaborativeSessionId: questUser.collaborative_session_id,
    };

    return this.http.post<QuestUserResource>(this.endpointUrl, resource).pipe(
      map((created) => this.assembler.toEntityFromResource(created)),
      catchError(this.handleError('Failed to create quest assignment')),
    );
  }

  getByUserAndQuest(userId: number, questId: number): Observable<QuestUser> {
    return this.http.get<QuestUserResource>(`${this.endpointUrl}/user/${userId}/quest/${questId}`).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to fetch quest assignment')),
    );
  }

  getByUserAndStatus(userId: number, status: string): Observable<QuestUser[]> {
    return this.http.get<QuestUserResource[]>(`${this.endpointUrl}/user/${userId}/status/${status}`).pipe(
      map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
      catchError(this.handleError('Failed to fetch quest assignments')),
    );
  }

  complete(questUserId: number): Observable<QuestUser> {
    return this.http.post<QuestUserResource>(`${this.endpointUrl}/${questUserId}/complete`, {}).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to complete quest assignment')),
    );
  }
}
