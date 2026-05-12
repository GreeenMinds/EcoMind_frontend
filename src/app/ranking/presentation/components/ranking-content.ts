import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RankingService } from '../../application/ranking';
import { RankingEntry } from '../../domain/model/ranking-entry.entity';
import { TimeApiService } from '../../infrastructure/time-api';

@Component({
  selector: 'app-ranking-content',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, TranslateModule],
  templateUrl: './ranking-content.html',
  styleUrl: './ranking-content.css'
})
export class RankingContent implements OnInit {
  private rankingService = inject(RankingService);
  private timeApi = inject(TimeApiService);
  private translate = inject(TranslateService);

  readonly rankingData = this.rankingService.rankingData;
  readonly currentDate = this.rankingService.currentDate;
  readonly loading = this.rankingService.loading;
  readonly activeRankingId = signal(1);

  readonly entries = computed(() => this.rankingData().get(this.activeRankingId()) ?? []);

  readonly rankingTypes = this.rankingService.rankings;

  readonly TITLE_KEYS: Record<number, string> = {
    1: 'ranking.title.global',
    2: 'ranking.title.monthly',
    3: 'ranking.title.weekly'
  };

  readonly dateRangeText = computed(() => {
    const now = this.currentDate();
    if (!now) return '';
    const locale = this.translate.currentLang || 'en';
    return this.timeApi.formatDateRange(now, this.activeRankingId(), locale);
  });

  ngOnInit(): void {
    this.rankingService.loadAllRankings();
    this.rankingService.loadRankingTypes();
  }

  prev(): void {
    this.activeRankingId.update(id => Math.max(1, id - 1));
  }

  next(): void {
    this.activeRankingId.update(id => Math.min(3, id + 1));
  }

  getMedalIcon(position: number): string {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return '';
  }

  getTop3(entries: RankingEntry[]) { return entries.filter(e => e.position <= 3); }
  getRestEntries(entries: RankingEntry[]) { return entries.filter(e => e.position > 3 && !e.isCurrentUser); }
  getCurrentUser(entries: RankingEntry[]) { return entries.find(e => e.isCurrentUser); }

  getInitials(name: string): string {
    if (!name) return 'EM';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');
  }

  getAvatarHue(userId: number): string {
    return `${(userId * 67) % 360}`;
  }

  trackByUserId(_index: number, entry: RankingEntry): number {
    return entry.userId;
  }
}
