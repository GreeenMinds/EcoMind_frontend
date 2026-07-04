import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { CommunityGoal } from '../domain/model/community-goal.entity';
import { CommunityGoalAssembler } from './community-goal-assembler';
import { CommunityGoalResource, CommunityGoalResponse } from './community-goal-response';

export class CommunityGoalsApiEndpoint extends BaseApiEndpoint<
  CommunityGoal,
  CommunityGoalResource,
  CommunityGoalResponse,
  CommunityGoalAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderCommunityGoalEndpointPath}`,
      new CommunityGoalAssembler(),
    );
  }
}
