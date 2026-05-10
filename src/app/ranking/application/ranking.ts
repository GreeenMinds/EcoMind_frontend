import { computed, inject, Injectable, signal, Signal, WritableSignal } from '@angular/core';
import { RankingEntry } from '../domain/model/ranking-entry.entity';
import { RankingApiService } from '../infrastructure/ranking-api';

/**
 * @summary Application service managing ranking state using Angular Signals.
 * @author Victor Jhosuef Laura Acosta
 */
@Injectable({ providedIn: 'root' })
export class RankingService {
  private rankingSignal: WritableSignal<RankingEntry[]> = signal<RankingEntry[]>([]);
  private rankingsSignal: WritableSignal<any[]>         = signal<any[]>([]);
  private api = inject(RankingApiService);

  readonly ranking: Signal<RankingEntry[]> = computed(() => this.rankingSignal());
  readonly rankings: Signal<any[]>         = computed(() => this.rankingsSignal());

  /**
   * @summary Loads ranking entries for a specific ranking type.
   */
  loadRanking(rankingId: number = 1): void {
    this.api.getRankingEntries(rankingId).subscribe({
      next: (data) => this.rankingSignal.set(data),
      error: (err)  => console.error('Error loading ranking:', err)
    });
  }

  /**
   * @summary Loads all available ranking types.
   */
  loadRankingTypes(): void {
    this.api.getRankings().subscribe({
      next: (data) => this.rankingsSignal.set(data),
      error: (err)  => console.error('Error loading ranking types:', err)
    });
  }
}