import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {BaseApiEndpoint} from '../../shared/infrastructure/base-api-endpoint';
import {ActivityUser} from '../domain/model/activity-user.entity';
import {ActivityUserAssembler} from './activity-user-assembler';
import {ActivityUserResponse, ActivityUserResource} from './activity-user-response';

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
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderUserActivityEndpointPath}`,
      new ActivityUserAssembler(),
    );
  }
}
