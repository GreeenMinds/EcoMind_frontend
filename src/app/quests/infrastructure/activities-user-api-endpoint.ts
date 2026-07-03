import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {BaseApiEndpoint} from '../../shared/infrastructure/base-api-endpoint';
import {ActivityUser} from '../domain/model/activity-user.entity';
import {ActivityUserAssembler} from './activity-user-assembler';
import {ActivityUserResponse, ActivityUserResource} from './activity-user-response';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export type SubmitActivityUserPayload = {
  data: Record<string, unknown>;
};

export class ActivitiesUserApiEndpoint extends BaseApiEndpoint<
  ActivityUser,
  ActivityUserResource,
  ActivityUserResponse,
  ActivityUserAssembler
> {
  /**
   * Creates an instance of ActivitiesUserApiEndpoint.
   * @param http - The HttpClient to be used for making API requests.
   */
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderUserActivityEndpointPath}`,
      new ActivityUserAssembler(),
    );
  }

  getByQuestUserId(questUserId: number): Observable<ActivityUser[]> {
    return this.http.get<ActivityUserResource[]>(`${this.endpointUrl}/quest-user/${questUserId}`).pipe(
      map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
      catchError(this.handleError('Failed to fetch activity assignments')),
    );
  }

  submit(activityUserId: number, payload: SubmitActivityUserPayload): Observable<ActivityUser> {
    return this.http.post<ActivityUserResource>(`${this.endpointUrl}/${activityUserId}/submit`, payload).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to submit activity')),
    );
  }
}
