import { HttpClient } from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {BaseApiEndpoint} from '../../shared/infrastructure/base-api-endpoint';
import {Activity} from '../domain/model/activity.entity';
import {ActivityAssembler} from './activity-assembler';
import {ActivityResponse, ActivityResource} from './activity-response';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export class ActivitiesApiEndpoint extends BaseApiEndpoint<
  Activity,
  ActivityResource,
  ActivityResponse,
  ActivityAssembler
> {
  /**
   * Creates an instance of ActivitiesApiEndpoint.
   * @param http - The HttpClient to be used for making API requests.
   */
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderActivityEndpointPath}`,
      new ActivityAssembler(),
    );
  }

  getByQuestId(questId: number): Observable<Activity[]> {
    return this.http.get<ActivityResource[]>(`${this.endpointUrl}/quest/${questId}`).pipe(
      map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
      catchError(this.handleError('Failed to fetch quest activities')),
    );
  }
}
