import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { UserAchievement } from '../domain/model/user-achievement.entity';
import { UserAchievementAssembler } from './user-achievement-assembler';
import { UserAchievementResource, UserAchievementResponse } from './user-achievement-response';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export class UserAchievementsApiEndpoint extends BaseApiEndpoint<
  UserAchievement,
  UserAchievementResource,
  UserAchievementResponse,
  UserAchievementAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderUserAchievementEndpointPath}`,
      new UserAchievementAssembler(),
    );
  }

  getByUserId(userId: number): Observable<UserAchievement[]> {
    return this.http.get<UserAchievementResource[]>(`${this.endpointUrl}/${userId}`).pipe(
      map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
      catchError(this.handleError('Failed to fetch user achievements')),
    );
  }
}
