import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RankingEntry } from '../domain/model/ranking-entry.entity';

@Injectable({ providedIn: 'root' })
export class RankingApiService {
  private baseUrl         = environment.platformProviderApiBaseUrl;
  private rankingPath     = environment.platformProviderRankingEndpointPath;
  private userRankingPath = environment.platformProviderUserRankingEndpointPath;
  private userPath        = environment.platformProviderUserEndpointPath;
  private http = inject(HttpClient);

  getRankingEntries(rankingId: number = 1): Observable<RankingEntry[]> {
    return forkJoin({
      userRankings:  this.http.get<any[]>(`${this.baseUrl}${this.userRankingPath}?ranking_id=${rankingId}`),
      users:         this.http.get<any[]>(`${this.baseUrl}${this.userPath}`),
      userCosmetics: this.http.get<any[]>(`${this.baseUrl}/user_cosmetic`),   // 👈
      cosmetics:     this.http.get<any[]>(`${this.baseUrl}/cosmetic`),        // 👈
    }).pipe(
      map(({ userRankings, users, userCosmetics, cosmetics }) => {
        const currentUserId = 1;

        return userRankings
          .sort((a, b) => a.rank - b.rank)
          .map(ur => {
            const user = users.find((u: any) => u.id === ur.user_id);

            // Avatar equipado del tipo 'avatar' para este usuario
            const equippedRecord = userCosmetics.find(
              uc => uc.user_id === ur.user_id && uc.equipped
            );
            const equippedCosmetic = equippedRecord
              ? cosmetics.find(c => c.id === equippedRecord.cosmetic_id && c.type === 'avatar')
              : null;

              
            const entry = new RankingEntry();
            entry.position      = ur.rank;
            entry.username      = user?.name ?? 'Unknown';
            entry.score         = ur.score;
            entry.avatarUrl = equippedCosmetic?.image_url ?? 'assets/images/cosmetics/eco-hat.png';
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