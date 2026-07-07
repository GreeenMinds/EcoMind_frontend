import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RankingEntryResponse } from './ranking-entry-response';

@Injectable({ providedIn: 'root' })
export class RankingApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.platformProviderBackendApiBaseUrl;
  private leaderboardPath = environment.platformProviderLeaderboardEndpointPath;

  getLeaderboard(rankingType: string, currentUserId?: number, communityId?: number): Observable<RankingEntryResponse[]> {
    let params = new HttpParams();
    if (currentUserId) {
      params = params.set('currentUserId', currentUserId);
    }
    if (communityId) {
      params = params.set('communityId', communityId);
    }
    return this.http.get<RankingEntryResponse[]>(
      `${this.baseUrl}${this.leaderboardPath}/${rankingType}/leaderboard`,
      { params },
    );
  }
}
