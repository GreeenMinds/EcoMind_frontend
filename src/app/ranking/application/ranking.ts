import { computed, inject, Injectable, signal, Signal, WritableSignal } from '@angular/core';
import { RankingEntry } from '../domain/model/ranking-entry.entity';
import { RankingApiService } from '../infrastructure/ranking-api';
import { ProfileService } from '../../profile/application/profile.service';

@Injectable({ providedIn: 'root' })
export class RankingService {
  private rankingDataSignal: WritableSignal<Map<number, RankingEntry[]>> = signal(new Map());
  private currentDateSignal: WritableSignal<Date | null> = signal(null);
  private rankingsSignal: WritableSignal<any[]> = signal([]);
  private loadingSignal: WritableSignal<boolean> = signal(false);
  private lastRefresh = 0;

  private api = inject(RankingApiService);
  private profileService = inject(ProfileService);

  readonly rankingData = this.rankingDataSignal.asReadonly();
  readonly currentDate = this.currentDateSignal.asReadonly();
  readonly rankings = this.rankingsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();

  readonly ranking: Signal<RankingEntry[]> = computed(() => this.rankingDataSignal().get(1) ?? []);

  constructor() {
    this.watchProfileChanges();
  }

  private watchProfileChanges(): void {
    let lastEcopoints = this.profileService.currentUserProfile()?.ecopoints;
    setInterval(() => {
      const current = this.profileService.currentUserProfile()?.ecopoints;
      if (current !== undefined && lastEcopoints !== undefined && current !== lastEcopoints) {
        lastEcopoints = current;
        this.loadAllRankings();
      }
      if (current !== undefined) {
        lastEcopoints = current;
      }
    }, 3000);
  }

  loadRanking(_rankingId: number = 1): void {
    this.loadAllRankings();
  }

  loadAllRankings(): void {
    if (this.loadingSignal()) return;
    this.loadingSignal.set(true);
    this.lastRefresh = Date.now();
    this.api.getAllRankingEntries().subscribe({
      next: (res) => {
        this.rankingDataSignal.set(res.data);
        this.currentDateSignal.set(res.now);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        console.error('Error loading rankings:', err);
        this.loadingSignal.set(false);
      }
    });
  }

  refresh(): void {
    if (Date.now() - this.lastRefresh < 2000) return;
    this.lastRefresh = Date.now();
    this.loadingSignal.set(false);
    this.loadAllRankings();
  }

  loadRankingTypes(): void {
    this.api.getRankings().subscribe({
      next: (data) => this.rankingsSignal.set(data),
      error: (err) => console.error('Error loading ranking types:', err)
    });
  }
}
