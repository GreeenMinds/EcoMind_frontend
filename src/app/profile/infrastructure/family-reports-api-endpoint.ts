import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CompletedQuest, FamilyReport } from '../domain/model/family-report.entity';

interface CompletedQuestResource {
  questTitle: string;
  completedAt: string | null;
  ecopoints: number;
  activityCount: number;
}

interface FamilyReportResource {
  familyId: number;
  hasData: boolean;
  completedQuestsThisWeek: number;
  completedQuests: CompletedQuestResource[];
  achievementsEarned: number;
  totalAchievements: number;
}

@Injectable({ providedIn: 'root' })
export class FamilyReportsApiEndpoint {
  private readonly baseUrl =
    `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderFamilyReportEndpointPath}`;
  private readonly http = inject(HttpClient);

  getWeeklyReport(familyId: number): Observable<FamilyReport> {
    return this.http.get<FamilyReportResource>(`${this.baseUrl}/${familyId}`).pipe(
      map((resource) => {
        const report = new FamilyReport();
        report.familyId = resource.familyId;
        report.hasData = resource.hasData;
        report.completedQuestsThisWeek = resource.completedQuestsThisWeek;
        report.achievementsEarned = resource.achievementsEarned;
        report.totalAchievements = resource.totalAchievements;
        report.completedQuests = resource.completedQuests.map((item) => {
          const quest = new CompletedQuest();
          quest.questTitle = item.questTitle;
          quest.completedAt = item.completedAt ?? '';
          quest.ecopoints = item.ecopoints;
          quest.activityCount = item.activityCount;
          return quest;
        });
        return report;
      }),
    );
  }
}
