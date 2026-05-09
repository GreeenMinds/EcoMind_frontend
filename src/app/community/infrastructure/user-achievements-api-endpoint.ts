import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { UserAchievement } from '../domain/model/user-achievement.entity';
import { UserAchievementAssembler } from './user-achievement-assembler';
import { UserAchievementResource, UserAchievementResponse } from './user-achievement-response';

export class UserAchievementsApiEndpoint extends BaseApiEndpoint<
  UserAchievement,
  UserAchievementResource,
  UserAchievementResponse,
  UserAchievementAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderUserAchievementEndpointPath}`,
      new UserAchievementAssembler(),
    );
  }
}
