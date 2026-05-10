import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Activity } from '../domain/model/activity.entity';
import { ActivityAssembler } from './activity-assembler';
import { ActivityResponse, ActivityResource } from './activity-response';

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
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderActivityEndpointPath}`,
      new ActivityAssembler(),
    );
  }
}
