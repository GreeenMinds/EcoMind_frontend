import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FamilyRankingService } from '../../application/family-ranking';
import { FamilyRankingEntry } from '../../domain/model/family-ranking-entry.entity';
import { QuestsService } from '../../../quests/application/quests.service';

@Component({
  selector: 'app-family-ranking-content',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './family-ranking-content.html',
  styleUrl: './family-ranking-content.css',
})
export class FamilyRankingContent implements OnInit {
  private readonly familyRankingService = inject(FamilyRankingService);
  private readonly questsService = inject(QuestsService);

  readonly entries = this.familyRankingService.entries;
  readonly loading = this.familyRankingService.loading;
  readonly currentFamilyId = this.questsService.currentFamilyId;

  ngOnInit(): void {
    this.familyRankingService.loadFamilyRanking();
  }

  getTop3(entries: FamilyRankingEntry[]) {
    return entries.filter((e) => e.position <= 3);
  }

  getRestEntries(entries: FamilyRankingEntry[]) {
    return entries.filter((e) => e.position > 3 && e.familyId !== this.currentFamilyId());
  }

  getCurrentFamily(entries: FamilyRankingEntry[]) {
    return entries.find((e) => e.familyId === this.currentFamilyId());
  }

  getMedalIcon(position: number): string {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return '';
  }

  getInitials(name: string): string {
    if (!name) return '--';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  getAvatarHue(familyId: number): string {
    return `${(familyId * 67) % 360}`;
  }

  trackByFamilyId(_index: number, entry: FamilyRankingEntry): number {
    return entry.familyId;
  }
}
