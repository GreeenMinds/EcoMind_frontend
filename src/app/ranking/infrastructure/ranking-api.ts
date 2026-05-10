import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RankingEntry } from '../domain/model/ranking-entry.entity';

/**
 * @summary Infrastructure service for ranking HTTP operations.
 * @author Victor Jhosef Laura Acosta
 */
@Injectable({ providedIn: 'root' })
export class RankingApiService {
  private baseUrl      = environment.platformProviderApiBaseUrl;
  private rankingPath  = environment.platformProviderRankingEndpointPath;
  private userRankingPath = environment.platformProviderUserRankingEndpointPath;
  private userPath     = environment.platformProviderUserEndpointPath;
  private http = inject(HttpClient);

  private readonly PHOTO_MAP: Record<number, string> = {
  1: 'assets/images/photos/carlos.jpg',
  2: 'assets/images/photos/nico.jpg',
  3: 'assets/images/photos/valeria.jpg',
  4: 'assets/images/photos/mateo.jpg'
};

getRankingEntries(rankingId: number = 1): Observable<RankingEntry[]> {
  return forkJoin({
    userRankings: this.http.get<any[]>(`${this.baseUrl}${this.userRankingPath}?ranking_id=${rankingId}`),
    users: this.http.get<any[]>(`${this.baseUrl}${this.userPath}`)
  }).pipe(
    map(({ userRankings, users }) => {
      const currentUserId = 1;
      return userRankings
        .sort((a, b) => a.rank - b.rank)
        .map(ur => {
          const user = users.find((u: any) => u.id === ur.user_id);
          const entry = new RankingEntry();
          entry.position      = ur.rank;
          entry.username      = user?.name ?? 'Unknown';
          entry.score         = ur.score;
          entry.avatarUrl     = this.PHOTO_MAP[ur.user_id] ?? 'assets/images/photos/carlos.jpg';
          entry.isCurrentUser = ur.user_id === currentUserId;
          return entry;
        });
    })
  );
}

  getRankings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}${this.rankingPath}`);
  }
}
