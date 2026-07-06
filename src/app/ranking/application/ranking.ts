import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { RankingEntry } from '../domain/model/ranking-entry.entity';
import { RankingApiService } from '../infrastructure/ranking-api';
import { RankingEntryAssembler } from '../infrastructure/ranking-entry-assembler';
import { CurrentUser } from '../../shared/application/current-user';
import { forkJoin } from 'rxjs';

const RANKING_TYPES: Record<number, string> = {
  1: 'GLOBAL',
  2: 'MONTHLY',
  3: 'WEEKLY',
};

@Injectable({ providedIn: 'root' })
export class RankingService {
  private rankingDataSignal: WritableSignal<Map<number, RankingEntry[]>> = signal(new Map());
  private loadingSignal: WritableSignal<boolean> = signal(false);

  private api = inject(RankingApiService);
  private currentUser = inject(CurrentUser);

  readonly rankingData = this.rankingDataSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();

  loadAllRankings(): void {
    if (this.loadingSignal()) return;
    this.loadingSignal.set(true);

    const userId = this.currentUser.getCurrentUserId() ?? undefined;

    const calls = [1, 2, 3].map((id) =>
      this.api.getLeaderboard(RANKING_TYPES[id], userId),
    );

    forkJoin(calls).subscribe({
      next: (results) => {
        const map = new Map<number, RankingEntry[]>();
        results.forEach((res, index) => {
          map.set(index + 1, RankingEntryAssembler.toEntitiesFromResponse(res));
        });
        this.rankingDataSignal.set(map);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
      },
    });
  }
}
