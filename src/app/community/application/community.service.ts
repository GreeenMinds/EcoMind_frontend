import { computed, DestroyRef, inject, Injectable, Signal, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, retry } from 'rxjs';
import { CurrentUser } from '../../shared/application/current-user';
import { Achievement } from '../domain/model/achievement.entity';
import { CommunityAchievement } from '../domain/model/community-achievement.entity';
import { CommunityGoal } from '../domain/model/community-goal.entity';
import { CommunityMember } from '../domain/model/community-member.entity';
import { CommunityPost } from '../domain/model/community-post.entity';
import { Community } from '../domain/model/community.entity';
import { EventRegistration } from '../domain/model/event-registration.entity';
import { Event } from '../domain/model/event.entity';
import { UserAchievement } from '../domain/model/user-achievement.entity';
import { CommunityApi } from '../infrastructure/community-api';

export interface CommunityPostSummary {
  post: CommunityPost;
  author?: CommunityMember;
}

export interface CommunityAchievementSummary {
  achievement: Achievement;
  communityAchievement?: CommunityAchievement;
  userAchievement?: UserAchievement;
  member?: CommunityMember;
  date: string;
}

export interface CommunityEventSummary {
  event: Event;
  author?: CommunityMember;
  registration?: EventRegistration;
  joined: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CommunityService {
  private readonly destroyRef = inject(DestroyRef);

  private readonly communitiesSignal = signal<Community[]>([]);
  private readonly membersSignal = signal<CommunityMember[]>([]);
  private readonly postsSignal = signal<CommunityPost[]>([]);
  private readonly goalsSignal = signal<CommunityGoal[]>([]);
  private readonly achievementsSignal = signal<Achievement[]>([]);
  private readonly communityAchievementsSignal = signal<CommunityAchievement[]>([]);
  private readonly userAchievementsSignal = signal<UserAchievement[]>([]);
  private readonly eventsSignal = signal<Event[]>([]);
  private readonly eventRegistrationsSignal = signal<EventRegistration[]>([]);

  readonly communities = this.communitiesSignal.asReadonly();
  readonly members = this.membersSignal.asReadonly();
  readonly posts = this.postsSignal.asReadonly();
  readonly goals = this.goalsSignal.asReadonly();
  readonly achievements = this.achievementsSignal.asReadonly();
  readonly communityAchievements = this.communityAchievementsSignal.asReadonly();
  readonly userAchievements = this.userAchievementsSignal.asReadonly();
  readonly events = this.eventsSignal.asReadonly();
  readonly eventRegistrations = this.eventRegistrationsSignal.asReadonly();

  private readonly loadingSignal = signal<boolean>(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  readonly currentUserId = computed(() => this.currentUser.getCurrentUserId());

  readonly currentMember = computed(() =>
    this.members().find((member) => member.id === this.currentUserId()),
  );

  readonly activeGoal = computed(() => this.goals().find((goal) => goal.status === 'active'));

  readonly postSummaries = computed(() =>
    this.posts()
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((post) => ({
        post,
        author: this.members().find((member) => member.id === post.user_id),
      })),
  );

  readonly eventSummaries = computed(() =>
    this.events()
      .slice()
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .map((event) => this.buildEventSummary(event)),
  );

  readonly joinedEvents = computed(() => this.eventSummaries().filter((summary) => summary.joined));

  readonly availableEvents = computed(() =>
    this.eventSummaries().filter((summary) => !summary.joined),
  );

  readonly achievementSummaries = computed<CommunityAchievementSummary[]>(() => {
    const summaries: CommunityAchievementSummary[] = [];

    this.communityAchievements().forEach((communityAchievement) => {
      const achievement = this.achievements().find(
        (item) => item.id === communityAchievement.achievement_id,
      );

      if (!achievement) {
        return;
      }

      summaries.push({
        achievement,
        communityAchievement,
        date: communityAchievement.date,
      });
    });

    this.userAchievements().forEach((userAchievement) => {
      const achievement = this.achievements().find(
        (item) => item.id === userAchievement.achievement_id,
      );

      if (!achievement) {
        return;
      }

      summaries.push({
        achievement,
        userAchievement,
        member: this.members().find((item) => item.id === userAchievement.user_id),
        date: userAchievement.date,
      });
    });

    return summaries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });
  constructor(
    private readonly communityApi: CommunityApi,
    private readonly currentUser: CurrentUser,
  ) {
    this.loadCommunityData();
  }

  refresh(): void {
    this.loadCommunityData();
  }

  getFilteredPosts(searchTerm: string): Signal<CommunityPostSummary[]> {
    return computed(() => {
      const normalizedSearchTerm = searchTerm.trim().toLowerCase();

      if (!normalizedSearchTerm) {
        return this.postSummaries();
      }

      return this.postSummaries().filter((summary) => {
        const authorName = summary.author?.name.toLowerCase() ?? '';
        return (
          summary.post.content.toLowerCase().includes(normalizedSearchTerm) ||
          authorName.includes(normalizedSearchTerm)
        );
      });
    });
  }

  getFilteredEvents(searchTerm: string): Signal<CommunityEventSummary[]> {
    return computed(() => {
      const normalizedSearchTerm = searchTerm.trim().toLowerCase();

      if (!normalizedSearchTerm) {
        return this.eventSummaries();
      }

      return this.eventSummaries().filter((summary) =>
        [
          summary.event.name,
          summary.event.description,
          summary.event.location,
          summary.author?.name ?? '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearchTerm),
      );
    });
  }

  joinEventAsIndividual(eventId: number): void {
    this.createRegistration(eventId, 'individual', null);
  }

  joinEventAsFamily(eventId: number, familyId: number): void {
    this.createRegistration(eventId, 'family', familyId);
  }

  cancelEventRegistration(eventId: number): void {
    const registration = this.findCurrentUserRegistration(eventId);

    if (!registration) {
      return;
    }

    registration.status = 'cancelled';
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.communityApi
      .updateEventRegistration(registration)
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedRegistration) => {
          this.eventRegistrationsSignal.update((registrations) =>
            registrations.map((item) =>
              item.id === updatedRegistration.id ? updatedRegistration : item,
            ),
          );
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(this.formatError(error, 'Could not cancel the registration'));
          this.loadingSignal.set(false);
        },
      });
  }

  createEvent(eventData: {
    name: string;
    description: string;
    date: string;
    start_time: string;
    end_time: string;
    location: string;
    latitude: number;
    longitude: number;
    capacity: number;
    image_url: string | null;
  }): void {
    const currentMember = this.currentMember();
    const event = new Event();

    event.id = 0;
    event.community_id = currentMember?.community_id ?? 1;
    event.author_id = this.currentUserId();
    event.name = eventData.name;
    event.description = eventData.description;
    event.date = eventData.date;
    event.start_time = eventData.start_time;
    event.end_time = eventData.end_time;
    event.location = eventData.location;
    event.latitude = eventData.latitude;
    event.longitude = eventData.longitude;
    event.capacity = eventData.capacity;
    event.image_url = eventData.image_url;

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.communityApi
      .createEvent(event)
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (createdEvent) => {
          this.eventsSignal.update((events) => [...events, createdEvent]);
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(this.formatError(error, 'Could not create the event'));
          this.loadingSignal.set(false);
        },
      });
  }

  private loadCommunityData(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    forkJoin({
      communities: this.communityApi.getCommunities(),
      members: this.communityApi.getCommunityMembers(),
      posts: this.communityApi.getCommunityPosts(),
      goals: this.communityApi.getCommunityGoals(),
      achievements: this.communityApi.getAchievements(),
      communityAchievements: this.communityApi.getCommunityAchievements(),
      userAchievements: this.communityApi.getUserAchievements(),
      events: this.communityApi.getEvents(),
      eventRegistrations: this.communityApi.getEventRegistrations(),
    })
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.communitiesSignal.set(data.communities);
          this.membersSignal.set(data.members);
          this.postsSignal.set(data.posts);
          this.goalsSignal.set(data.goals);
          this.achievementsSignal.set(data.achievements);
          this.communityAchievementsSignal.set(data.communityAchievements);
          this.userAchievementsSignal.set(data.userAchievements);
          this.eventsSignal.set(data.events);
          this.eventRegistrationsSignal.set(data.eventRegistrations);
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(this.formatError(error, 'Could not load the community'));
          this.loadingSignal.set(false);
        },
      });
  }

  private createRegistration(
    eventId: number,
    registrationType: string,
    familyId: number | null,
  ): void {
    if (this.findCurrentUserRegistration(eventId)) {
      return;
    }

    const registration = new EventRegistration();
    registration.id = 0;
    registration.event_id = eventId;
    registration.user_id = this.currentUserId();
    registration.family_id = familyId;
    registration.registration_type = registrationType;
    registration.registered_at = new Date().toISOString();
    registration.status = 'active';

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.communityApi
      .createEventRegistration(registration)
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (createdRegistration) => {
          this.eventRegistrationsSignal.update((registrations) => [
            ...registrations,
            createdRegistration,
          ]);
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(this.formatError(error, 'Could not register for the event'));
          this.loadingSignal.set(false);
        },
      });
  }

  private buildEventSummary(event: Event): CommunityEventSummary {
    const registration = this.findCurrentUserRegistration(event.id);

    return {
      event,
      author: this.members().find((member) => member.id === event.author_id),
      registration,
      joined: registration?.status === 'active',
    };
  }

  private findCurrentUserRegistration(eventId: number): EventRegistration | undefined {
    return this.eventRegistrations().find(
      (registration) =>
        registration.event_id === eventId &&
        registration.user_id === this.currentUserId() &&
        registration.status === 'active',
    );
  }

  private formatError(error: unknown, fallback: string): string {
    if (error instanceof Error) {
      return error.message.includes('Resource not found')
        ? `${fallback}: Resource not found`
        : error.message;
    }

    return fallback;
  }
}
