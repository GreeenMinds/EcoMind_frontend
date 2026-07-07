import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Goal } from '../domain/model/goal.entity';
import { GoalAssembler } from './goal-assembler';
import { GoalResource, GoalResponse } from './goal-response';

export class GoalsApiEndpoint extends BaseApiEndpoint<
  Goal,
  GoalResource,
  GoalResponse,
  GoalAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderGoalEndpointPath}`,
      new GoalAssembler(),
    );
  }
}
