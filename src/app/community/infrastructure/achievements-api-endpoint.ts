import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Achievement } from '../domain/model/achievement.entity';
import { AchievementAssembler } from './achievement-assembler';
import { AchievementResource, AchievementResponse } from './achievement-response';

export class AchievementsApiEndpoint extends BaseApiEndpoint<
  Achievement,
  AchievementResource,
  AchievementResponse,
  AchievementAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderAchievementEndpointPath}`,
      new AchievementAssembler(),
    );
  }
}
