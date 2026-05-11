import { Component, OnInit, inject, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { RankingService } from '../../application/ranking';
import { RankingEntry }   from '../../domain/model/ranking-entry.entity';

@Component({
  selector: 'app-ranking-content',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, TranslateModule],
  templateUrl: './ranking-content.html',
  styleUrl: './ranking-content.css'
})
export class RankingContent implements OnInit {
  private rankingService = inject(RankingService);

  readonly ranking: Signal<RankingEntry[]> = this.rankingService.ranking;
  readonly rankingTypes: Signal<any[]>     = this.rankingService.rankings;

  activeRankingId = 1;

  readonly TITLE_KEYS: Record<number, string> = {
    1: 'ranking.title.global',
    2: 'ranking.title.monthly',
    3: 'ranking.title.weekly'
  };

  readonly SUBTITLE_KEYS: Record<number, string> = {
    1: 'ranking.subtitle.global',
    2: 'ranking.subtitle.monthly',
    3: 'ranking.subtitle.weekly'
  };

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

  getMedalIcon(position: number): string {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return '';
  }

  getTop3(entries: RankingEntry[])        { return entries.filter(e => e.position <= 3); }
  getRestEntries(entries: RankingEntry[]) { return entries.filter(e => e.position > 3 && !e.isCurrentUser); }
  getCurrentUser(entries: RankingEntry[]) { return entries.find(e => e.isCurrentUser); }
}