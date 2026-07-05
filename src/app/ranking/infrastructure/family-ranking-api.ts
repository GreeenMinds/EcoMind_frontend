import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FamilyRankingEntry } from '../domain/model/family-ranking-entry.entity';

interface FamilyRankingResource {
  familyId: number;
  familyName: string;
  totalEcopoints: number;
  position: number;
}

@Injectable({ providedIn: 'root' })
export class FamilyRankingApiService {
  private readonly endpointUrl =
    `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderFamilyRankingEndpointPath}`;
  private readonly http = inject(HttpClient);

  getFamilyRanking(): Observable<FamilyRankingEntry[]> {
    return this.http.get<FamilyRankingResource[]>(this.endpointUrl).pipe(
      map((resources) =>
        resources.map((resource) => {
          const entry = new FamilyRankingEntry();
          entry.familyId = resource.familyId;
          entry.familyName = resource.familyName;
          entry.totalEcopoints = resource.totalEcopoints;
          entry.position = resource.position;
          return entry;
        }),
      ),
    );
  }
}
