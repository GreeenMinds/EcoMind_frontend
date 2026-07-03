import {Component, computed, inject, OnInit} from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import {TranslatePipe} from '@ngx-translate/core';
import {ProfileService} from '../../../../profile/application/profile.service';
import {RankingService} from '../../../../ranking/application/ranking';
import {QuestProgressPanel} from '../quest-progress-panel/quest-progress-panel';

@Component({
  selector: 'app-quests-content',
  imports: [QuestProgressPanel, RouterOutlet, TranslatePipe],
  templateUrl: './quests-content.html',
  styleUrl: './quests-content.css',
})
export class QuestsContent implements OnInit {
  private readonly router = inject(Router);
  private readonly profileService = inject(ProfileService);
  private readonly rankingService = inject(RankingService);

  readonly userStreak = computed(
    () => this.profileService.currentUserProfile()?.streak ?? 0,
  );
  readonly weeklyRankingPosition = computed(
    () => this.rankingService.rankingData().get(3)?.find((entry) => entry.isCurrentUser)?.position ?? '-',
  );

  ngOnInit(): void {
    this.profileService.refreshCurrentUser().subscribe();
    this.rankingService.loadAllRankings();
  }

  showQuestSummaryPanel(): boolean {
    const currentPath = this.router.url.split(/[?#]/)[0];
    return currentPath === '/quests' || currentPath === '/quests/';
  }
}
