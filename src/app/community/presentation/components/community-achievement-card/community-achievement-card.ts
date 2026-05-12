import { Component, Input } from '@angular/core';
import { CommunityAchievementSummary } from '../../../application/community.service';

@Component({
  selector: 'app-community-achievement-card',
  imports: [],
  templateUrl: './community-achievement-card.html',
  styleUrl: './community-achievement-card.css',
})
export class CommunityAchievementCard {
  @Input() summary!: CommunityAchievementSummary;

  get title(): string {
    return this.summary.member?.name ?? this.summary.achievement.name;
  }

  get icon(): string {
    return this.summary.achievement.type === 'community' ? '🏅' : '🏆';
  }
}
