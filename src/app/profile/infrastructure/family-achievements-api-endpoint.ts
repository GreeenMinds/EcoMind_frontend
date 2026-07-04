import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FamilyAchievement } from '../domain/model/family-achievement.entity';

interface FamilyAchievementResource {
  id: number;
  familyId: number;
  achievementId: number;
  achievementName: string;
  achievementDescription: string;
  earnedAt: string;
}

@Injectable({ providedIn: 'root' })
export class FamilyAchievementsApiEndpoint {
  private readonly baseUrl =
    `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderFamilyAchievementEndpointPath}`;
  private readonly http = inject(HttpClient);

  getByFamilyId(familyId: number): Observable<FamilyAchievement[]> {
    return this.http.get<FamilyAchievementResource[]>(`${this.baseUrl}/${familyId}`).pipe(
      map((resources) =>
        resources.map((resource) => {
          const achievement = new FamilyAchievement();
          achievement.id = resource.id;
          achievement.familyId = resource.familyId;
          achievement.achievementId = resource.achievementId;
          achievement.achievementName = resource.achievementName;
          achievement.achievementDescription = resource.achievementDescription;
          achievement.earnedAt = resource.earnedAt;
          return achievement;
        }),
      ),
    );
  }
}
