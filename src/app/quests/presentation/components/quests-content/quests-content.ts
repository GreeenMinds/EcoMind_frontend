import {Component, computed, DestroyRef, inject, OnInit, signal} from '@angular/core';
import {NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {filter} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {TranslatePipe} from '@ngx-translate/core';
import {ProfileService} from '../../../../profile/application/profile.service';
import {RankingService} from '../../../../ranking/application/ranking';
import {CommunityService} from '../../../../community/application/community.service';
import {UserAchievement} from '../../../../community/domain/model/user-achievement.entity';
import {AchievementUnlockedModal} from '../../../../shared/presentation/components/achievement-unlocked-modal/achievement-unlocked-modal';
import {QuestProgressPanel} from '../quest-progress-panel/quest-progress-panel';
import {FamilyPlanPanel} from '../family-plan-panel/family-plan-panel';

@Component({
  selector: 'app-quests-content',
  imports: [QuestProgressPanel, FamilyPlanPanel, RouterOutlet, AchievementUnlockedModal, TranslatePipe],
  templateUrl: './quests-content.html',
  styleUrl: './quests-content.css',
})
export class QuestsContent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly profileService = inject(ProfileService);
  private readonly rankingService = inject(RankingService);
  private readonly communityService = inject(CommunityService);

  readonly userStreak = computed(
    () => this.profileService.currentUserProfile()?.streak ?? 0,
  );
  readonly weeklyRankingPosition = computed(
    () => this.rankingService.rankingData().get(3)?.find((entry) => entry.isCurrentUser)?.position ?? '-',
  );
  readonly achievementQueue = signal<string[]>([]);
  readonly activeAchievementName = computed(() => this.achievementQueue()[0] ?? null);

  ngOnInit(): void {
    this.profileService.refreshCurrentUser().subscribe();
    this.rankingService.loadAllRankings();
    this.refreshAchievementsOnMainQuestPage();
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.refreshAchievementsOnMainQuestPage());
  }

  showQuestSummaryPanel(): boolean {
    const currentPath = this.router.url.split(/[?#]/)[0];
    return currentPath === '/quests' || currentPath === '/quests/';
  }

  continueAchievementModal(): void {
    const [, ...remaining] = this.achievementQueue();
    this.achievementQueue.set(remaining);
  }

  private refreshAchievementsOnMainQuestPage(): void {
    if (!this.showQuestSummaryPanel()) {
      return;
    }

    this.communityService
      .refreshCurrentUserAchievements()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (achievements) => {
          this.achievementQueue.set(
            achievements
              .filter((achievement) => achievement.newly_unlocked)
              .map((achievement) => this.getAchievementName(achievement)),
          );
        },
        error: () => {},
      });
  }

  private getAchievementName(achievement: UserAchievement): string {
    return (
      achievement.achievement_name ||
      this.communityService
        .achievements()
        .find((item) => item.id === achievement.achievement_id)?.name ||
      'Logro'
    );
  }
}
