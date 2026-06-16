import { Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
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
    TranslatePipe,
  ],
  templateUrl: './community-content.html',
  styleUrl: './community-content.css',
})
export class CommunityContent {
  readonly communityService = inject(CommunityService);

  readonly searchTerm = signal('');
  readonly activeTab = signal<CommunityTab>('all');
  readonly achievementPeriod = signal<AchievementPeriod>('all');
  readonly showEventForm = signal(false);
  readonly showPostForm = signal(false);
  readonly selectedEvent = signal<CommunityEventSummary | null>(null);

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
      this.selectedEvent.set(summary);
    }
  }

  closeRegistrationModal(): void {
    this.selectedEvent.set(null);
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

    this.communityService.joinEventAsFamily(summary.event.id, 1);
    this.closeRegistrationModal();
  }
}
