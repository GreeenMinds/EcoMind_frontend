import { Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CommunityService, CommunityEventSummary } from '../../../application/community.service';
import { CommunitySearchBar } from '../community-search-bar/community-search-bar';
import { CommunityTabs } from '../community-tabs/community-tabs';
import { CommunityFeed } from '../community-feed/community-feed';
import { CommunityGoalCard } from '../community-goal-card/community-goal-card';
import { CommunityEventsMap } from '../community-events-map/community-events-map';
import { CommunityAchievementsList } from '../community-achievements-list/community-achievements-list';
import { CommunityEventsList } from '../community-events-list/community-events-list';
import { CommunityEventFormModal } from '../community-event-form-modal/community-event-form-modal';
import { CommunityEventRegistrationModal } from '../community-event-registration-modal/community-event-registration-modal';
import { CommunityPostFormModal } from '../community-post-form-modal/community-post-form-modal';
import { AchievementUnlockedModal } from '../../../../shared/presentation/components/achievement-unlocked-modal/achievement-unlocked-modal';
import { CommunityAchievement } from '../../../domain/model/community-achievement.entity';

type CommunityTab = 'all' | 'achievements' | 'events';
type AchievementPeriod = 'all' | 'week' | 'month';

@Component({
  selector: 'app-community-content',
  imports: [
    CommunitySearchBar,
    CommunityTabs,
    CommunityFeed,
    CommunityGoalCard,
    CommunityEventsMap,
    CommunityAchievementsList,
    CommunityEventsList,
    CommunityEventFormModal,
    CommunityEventRegistrationModal,
    CommunityPostFormModal,
    AchievementUnlockedModal,
    TranslatePipe,
  ],
  templateUrl: './community-content.html',
  styleUrl: './community-content.css',
})
export class CommunityContent {
  readonly communityService = inject(CommunityService);
  private readonly translate = inject(TranslateService);

  readonly searchTerm = signal('');
  readonly activeTab = signal<CommunityTab>('all');
  readonly achievementPeriod = signal<AchievementPeriod>('all');
  readonly showEventForm = signal(false);
  readonly showPostForm = signal(false);
  readonly selectedEvent = signal<CommunityEventSummary | null>(null);
  readonly familyRegistrationWarning = signal(false);
  readonly achievementQueue = signal<string[]>([]);
  readonly activeAchievementName = computed(() => this.achievementQueue()[0] ?? null);

  readonly filteredPosts = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.communityService.postSummaries();

    return this.communityService.postSummaries().filter((summary) => {
      const authorName = summary.author?.name.toLowerCase() ?? '';
      return summary.post.content.toLowerCase().includes(term) || authorName.includes(term);
    });
  });

  readonly filteredEvents = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.communityService.eventSummaries();

    return this.communityService
      .eventSummaries()
      .filter((summary) =>
        [
          summary.event.name,
          summary.event.description,
          summary.event.location,
          summary.author?.name ?? '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(term),
      );
  });

  readonly filteredAchievements = computed(() => {
    const now = new Date();
    return this.communityService.achievementSummaries().filter((summary) => {
      if (this.achievementPeriod() === 'all') return true;

      const date = new Date(summary.date);
      const days = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

      if (this.achievementPeriod() === 'week') return days <= 7;
      return days <= 31;
    });
  });

  selectTab(tab: CommunityTab): void {
    this.activeTab.set(tab);

    if (tab === 'achievements') {
      this.refreshCommunityAchievements();
    }
  }

  selectAchievementPeriod(period: AchievementPeriod): void {
    this.achievementPeriod.set(period);
  }

  openEventForm(): void {
    this.showEventForm.set(true);
  }

  closeEventForm(): void {
    this.showEventForm.set(false);
  }

  openPostForm(): void {
    this.showPostForm.set(true);
  }

  closePostForm(): void {
    this.showPostForm.set(false);
  }

  openRegistrationModal(summary: CommunityEventSummary): void {
    if (!summary.joined) {
      this.familyRegistrationWarning.set(false);
      this.selectedEvent.set(summary);
    }
  }

  closeRegistrationModal(): void {
    this.familyRegistrationWarning.set(false);
    this.selectedEvent.set(null);
  }

  deleteEvent(summary: CommunityEventSummary): void {
    const confirmed = window.confirm(
      this.translate.instant('community.eventCard.confirmDelete', {
        event: summary.event.name,
      }),
    );

    if (confirmed) {
      this.communityService.deleteEvent(summary.event.id);
    }
  }

  joinSelectedEventAsIndividual(): void {
    const summary = this.selectedEvent();
    if (!summary) return;

    this.communityService.joinEventAsIndividual(summary.event.id);
    this.closeRegistrationModal();
  }

  joinSelectedEventAsFamily(): void {
    const summary = this.selectedEvent();
    if (!summary) return;

    this.familyRegistrationWarning.set(false);
    this.communityService.joinEventAsFamily(summary.event.id).subscribe((joined) => {
      if (joined) {
        this.closeRegistrationModal();
        return;
      }

      this.familyRegistrationWarning.set(true);
    });
  }

  continueAchievementModal(): void {
    const [, ...remaining] = this.achievementQueue();
    this.achievementQueue.set(remaining);
  }

  private refreshCommunityAchievements(): void {
    this.communityService.refreshCurrentCommunityAchievements().subscribe({
      next: (achievements) => {
        this.achievementQueue.set(
          this.communityService
            .filterCommunityScopedAchievements(achievements)
            .filter((achievement) => achievement.newly_unlocked)
            .map((achievement) => this.getAchievementName(achievement)),
        );
      },
      error: () => {},
    });
  }

  private getAchievementName(achievement: CommunityAchievement): string {
    return (
      achievement.achievement_name ||
      this.communityService
        .achievements()
        .find((item) => item.id === achievement.achievement_id)?.name ||
      'Logro'
    );
  }
}
