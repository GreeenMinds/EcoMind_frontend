import { Component, OnInit, inject, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RankingService } from '../../application/ranking';
import { RankingEntry }   from '../../domain/model/ranking-entry.entity';

/**
 * @summary Presentation component that displays the global ranking leaderboard.
 * @author Victor Jhosuef Laura Acosta
 */
@Component({
  selector: 'app-ranking-content',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './ranking-content.html',
  styleUrl: './ranking-content.css'
})
export class RankingContent implements OnInit {
  private rankingService: RankingService = inject(RankingService);

  readonly ranking: Signal<RankingEntry[]> = this.rankingService.ranking;
  readonly rankingTypes: Signal<any[]>     = this.rankingService.rankings;

  readonly RANKING_NAMES: Record<number, string> = {
    1: 'Global',
    2: 'Mensual',
    3: 'Semanal'
  };

  readonly RANKING_SUBTITLES: Record<number, string> = {
    1: 'Todos los tiempos',
    3: '1 – 7 mayo 2026',
    2: 'Mayo 2026'
  };

  activeRankingId = 1;


  ngOnInit(): void {
    this.rankingService.loadRankingTypes();
    this.rankingService.loadRanking(this.activeRankingId);
  }

  prev(): void {
    if (this.activeRankingId > 1) {
      this.activeRankingId--;
      this.rankingService.loadRanking(this.activeRankingId);
    }
  }

  next(): void {
    if (this.activeRankingId < 3) {
      this.activeRankingId++;
      this.rankingService.loadRanking(this.activeRankingId);
    }
  }

 getActiveRankingName(): string {
  return this.RANKING_NAMES[this.activeRankingId] ?? 'Ranking';
}

getActiveRankingSubtitle(): string {
  return this.RANKING_SUBTITLES[this.activeRankingId] ?? '';
}
  getMedalIcon(position: number): string {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return '';
  }

  getTop3(entries: RankingEntry[]): RankingEntry[] {
    return entries.filter(e => e.position <= 3);
  }

  getRestEntries(entries: RankingEntry[]): RankingEntry[] {
    return entries.filter(e => e.position > 3 && !e.isCurrentUser);
  }

  getCurrentUser(entries: RankingEntry[]): RankingEntry | undefined {
    return entries.find(e => e.isCurrentUser);
  }
}