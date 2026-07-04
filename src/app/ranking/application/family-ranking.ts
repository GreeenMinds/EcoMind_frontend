import { inject, Injectable, signal } from '@angular/core';
import { FamilyRankingApiService } from '../infrastructure/family-ranking-api';
import { FamilyRankingEntry } from '../domain/model/family-ranking-entry.entity';

@Injectable({ providedIn: 'root' })
export class FamilyRankingService {
  private readonly api = inject(FamilyRankingApiService);

  private readonly entriesSignal = signal<FamilyRankingEntry[]>([]);
  private readonly loadingSignal = signal(false);

  readonly entries = this.entriesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();

  loadFamilyRanking(): void {
    this.loadingSignal.set(true);
    this.api.getFamilyRanking().subscribe({
      next: (entries) => {
        this.entriesSignal.set(entries);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        console.error('Error loading family ranking:', err);
        this.loadingSignal.set(false);
      },
    });
  }
}
