import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { CommunityAchievement } from '../domain/model/community-achievement.entity';
import { CommunityAchievementAssembler } from './community-achievement-assembler';
import {
  CommunityAchievementResource,
  CommunityAchievementResponse,
} from './community-achievement-response';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export class CommunityAchievementsApiEndpoint extends BaseApiEndpoint<
  CommunityAchievement,
  CommunityAchievementResource,
  CommunityAchievementResponse,
  CommunityAchievementAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderCommunityAchievementEndpointPath}`,
      new CommunityAchievementAssembler(),
    );
  }

  getByCommunityId(communityId: number): Observable<CommunityAchievement[]> {
    return this.http.get<CommunityAchievementResource[]>(`${this.endpointUrl}/${communityId}`).pipe(
      map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
      catchError(this.handleError('Failed to fetch community achievements')),
    );
  }
}
