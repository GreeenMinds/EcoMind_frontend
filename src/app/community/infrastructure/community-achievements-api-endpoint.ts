import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { CommunityAchievement } from '../domain/model/community-achievement.entity';
import { CommunityAchievementAssembler } from './community-achievement-assembler';
import {
  CommunityAchievementResource,
  CommunityAchievementResponse,
} from './community-achievement-response';

export class CommunityAchievementsApiEndpoint extends BaseApiEndpoint<
  CommunityAchievement,
  CommunityAchievementResource,
  CommunityAchievementResponse,
  CommunityAchievementAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderCommunityAchievementEndpointPath}`,
      new CommunityAchievementAssembler(),
    );
  }
}
