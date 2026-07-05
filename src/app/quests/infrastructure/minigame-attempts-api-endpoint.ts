import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {BaseApiEndpoint} from '../../shared/infrastructure/base-api-endpoint';
import {MinigameAttempt} from '../domain/model/minigame-attempt.entity';
import {MinigameAttemptAssembler} from './minigame-attempt-assembler';
import {MinigameAttemptResponse, MinigameAttemptResource} from './minigame-attempt-response';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

export type CreateMinigameAttemptPayload = {
  userId: number;
  questId: number;
};

export type FinishMinigameAttemptPayload = {
  score: number;
  metadata: Record<string, unknown>;
};

export class MinigameAttemptsApiEndpoint extends BaseApiEndpoint<
  MinigameAttempt,
  MinigameAttemptResource,
  MinigameAttemptResponse,
  MinigameAttemptAssembler
> {
  /**
   * Creates an instance of MinigameAttemptsApiEndpoint.
   * @param http - The HttpClient to be used for making API requests.
   */
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderMinigameAttemptEndpointPath}`,
      new MinigameAttemptAssembler(),
    );
  }

  getByUserAndMinigame(userId: number, minigameId: number): Observable<MinigameAttempt[]> {
    const params = new HttpParams()
      .set('userId', userId)
      .set('minigameId', minigameId);

    return this.http.get<MinigameAttemptResource[]>(this.endpointUrl, { params }).pipe(
      map((resources) =>
        resources.map((resource) => this.assembler.toEntityFromResource(resource)),
      ),
    );
  }

  createAttempt(payload: CreateMinigameAttemptPayload): Observable<MinigameAttempt> {
    return this.http.post<MinigameAttemptResource>(this.endpointUrl, payload).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
    );
  }

  finishAttempt(
    attemptId: number,
    payload: FinishMinigameAttemptPayload,
  ): Observable<MinigameAttempt> {
    return this.http
      .post<MinigameAttemptResource>(`${this.endpointUrl}/${attemptId}/finish`, payload)
      .pipe(map((resource) => this.assembler.toEntityFromResource(resource)));
  }

  cancelAttempt(attemptId: number): Observable<MinigameAttempt> {
    return this.http
      .post<MinigameAttemptResource>(`${this.endpointUrl}/${attemptId}/cancel`, {})
      .pipe(map((resource) => this.assembler.toEntityFromResource(resource)));
  }
}
