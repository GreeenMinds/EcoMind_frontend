import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CommunityAchievementSummary } from '../../../application/community.service';
import { CommunityAchievementCard } from '../community-achievement-card/community-achievement-card';

export type AchievementPeriod = 'all' | 'week' | 'month';

@Component({
  selector: 'app-community-achievements-list',
  imports: [CommunityAchievementCard, TranslatePipe],
  templateUrl: './community-achievements-list.html',
  styleUrl: './community-achievements-list.css',
})
export class CommunityAchievementsList {
  @Input() achievements: CommunityAchievementSummary[] = [];
  @Input() period: AchievementPeriod = 'all';
  @Output() periodChange = new EventEmitter<AchievementPeriod>();
}
