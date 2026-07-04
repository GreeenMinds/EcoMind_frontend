import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { map, Observable, retry, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CurrentUser } from '../../shared/application/current-user';
import { Friend } from '../../profile/domain/model/friend.entity';
import { Achievement } from '../domain/model/achievement.entity';
import { CommunityAchievement } from '../domain/model/community-achievement.entity';
import { CommunityGoal } from '../domain/model/community-goal.entity';
import { CommunityMember } from '../domain/model/community-member.entity';
import { CommunityPost } from '../domain/model/community-post.entity';
import {
  COMMUNITY_POST_REACTION_OPTIONS,
  CommunityPostReaction,
  CommunityPostReactionType,
} from '../domain/model/community-post-reaction.entity';
import { Community } from '../domain/model/community.entity';
import { EventRegistration } from '../domain/model/event-registration.entity';
import { Event } from '../domain/model/event.entity';
import { UserAchievement } from '../domain/model/user-achievement.entity';
import { CommunityApi } from '../infrastructure/community-api';

export interface CommunityPostSummary {
  post: CommunityPost;
  author?: CommunityMember;
  reactions: CommunityPostReactionSummary[];
  currentUserReaction?: CommunityPostReaction;
}

export interface CommunityPostReactionSummary {
  reaction: CommunityPostReaction;
  member?: CommunityMember;
  imageUrl: string;
  labelKey: string;
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
  canDelete: boolean;
}

export interface CommunityPostFormValue {
  content: string;
  points: number;
  image_url: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class CommunityService {
  private readonly destroyRef = inject(DestroyRef);

  private readonly communitiesSignal = signal<Community[]>([]);
  private readonly membersSignal = signal<CommunityMember[]>([]);
  private readonly postsSignal = signal<CommunityPost[]>([]);
  private readonly realPostsSignal = signal<CommunityPost[]>([]);
  private readonly postReactionsSignal = signal<CommunityPostReaction[]>([]);
  private readonly goalsSignal = signal<CommunityGoal[]>([]);
  private readonly achievementsSignal = signal<Achievement[]>([]);
  private readonly communityAchievementsSignal = signal<CommunityAchievement[]>([]);
  private readonly userAchievementsSignal = signal<UserAchievement[]>([]);
  private readonly eventsSignal = signal<Event[]>([]);
  private readonly eventRegistrationsSignal = signal<EventRegistration[]>([]);

  readonly communities = this.communitiesSignal.asReadonly();
  readonly members = this.membersSignal.asReadonly();
  readonly posts = this.postsSignal.asReadonly();
  readonly postReactions = this.postReactionsSignal.asReadonly();
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
    [...this.posts(), ...this.realPostsSignal()]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((post) => ({
        post,
        author: this.members().find((member) => member.id === post.user_id),
        reactions: this.buildPostReactionSummaries(post.id),
        currentUserReaction: this.findCurrentUserReaction(post.id),
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
    private readonly http: HttpClient,
  ) {
    this.loadCommunityData();
    this.loadRealPosts();
  }

  private loadRealPosts(): void {
    const realPostsUrl =
      `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderCommunityPostRealEndpointPath}`;
    this.http.get<CommunityPost[]>(realPostsUrl).subscribe({
      next: (posts) => this.realPostsSignal.set(posts),
      error: () => this.realPostsSignal.set([]),
    });
  }

  refresh(): void {
    this.loadCommunityData();
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

  deleteEvent(eventId: number): void {
    const event = this.events().find((item) => item.id === eventId);

    if (!event || event.author_id !== this.currentUserId()) {
      return;
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.communityApi
      .deleteEvent(eventId)
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.eventsSignal.update((events) => events.filter((item) => item.id !== eventId));
          this.eventRegistrationsSignal.update((registrations) =>
            registrations.filter((registration) => registration.event_id !== eventId),
          );
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(this.formatError(error, 'Could not delete the event'));
          this.loadingSignal.set(false);
        },
      });
  }

  createPost(postData: CommunityPostFormValue): void {
    const currentMember = this.currentMember();
    const post = new CommunityPost();

    post.id = 0;
    post.community_id = currentMember?.community_id ?? 1;
    post.user_id = this.currentUserId();
    post.content = postData.content;
    post.points = postData.points;
    post.likes = 0;
    post.image_url = postData.image_url;
    post.created_at = new Date().toISOString();

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.communityApi
      .createPost(post)
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (createdPost) => {
          this.postsSignal.update((posts) => [...posts, createdPost]);
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(this.formatError(error, 'Could not create the post'));
          this.loadingSignal.set(false);
        },
      });
  }

  shareAchievement(postData: CommunityPostFormValue): Observable<CommunityPost> {
    const currentMember = this.currentMember();
    const realPostsUrl =
      `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderCommunityPostRealEndpointPath}`;

    const payload = {
      community_id: currentMember?.community_id ?? 1,
      user_id: this.currentUserId(),
      content: postData.content,
      points: postData.points,
      image_url: postData.image_url,
    };

    return this.http.post<CommunityPost>(realPostsUrl, payload).pipe(
      tap((createdPost) => {
        this.realPostsSignal.update((posts) => [...posts, createdPost]);
        this.notifyConnectedFriends(createdPost);
      }),
    );
  }

  private notifyConnectedFriends(post: CommunityPost): void {
    const currentUserId = this.currentUserId();
    const friendsUrl =
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderFriendEndpointPath}`;

    this.http.get<Friend[]>(friendsUrl).subscribe({
      next: (friends) => {
        friends
          .filter((friend) => friend.status === 'accepted')
          .map((friend) => (friend.user_id === currentUserId ? friend.friend_id : friend.user_id))
          .forEach((friendId) => {
            const notificationUrl =
              `${environment.platformProviderApiBaseUrl}${environment.platformProviderUserNotificationEndpointPath}`;
            this.http
              .post(notificationUrl, {
                user_id: friendId,
                type: 'community_post',
                reference_id: post.id,
                message: 'Un amigo compartio un logro en la comunidad',
                read: false,
                created_at: new Date().toISOString(),
              })
              .subscribe();
          });
      },
    });
  }

  selectPostReaction(postId: number, reactionType: CommunityPostReactionType): void {
    const currentReaction = this.findCurrentUserReaction(postId);

    if (currentReaction?.reaction_type === reactionType) {
      this.unreactToPost(postId);
      return;
    }

    if (currentReaction) {
      this.updatePostReaction(currentReaction, reactionType);
      return;
    }

    this.reactToPost(postId, reactionType);
  }

  unreactToPost(postId: number): void {
    const reaction = this.findCurrentUserReaction(postId);
    const post = this.posts().find((item) => item.id === postId);

    if (!reaction || !post) {
      return;
    }

    const updatedPost = Object.assign(new CommunityPost(), post, {
      likes: Math.max(0, post.likes - 1),
    });

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.communityApi
      .deletePostReaction(reaction.id)
      .pipe(
        switchMap(() => this.communityApi.updatePost(updatedPost)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (savedPost) => {
          this.postReactionsSignal.update((reactions) =>
            reactions.filter((item) => item.id !== reaction.id),
          );
          this.replacePost(savedPost);
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(this.formatError(error, 'Could not remove the reaction'));
          this.loadingSignal.set(false);
        },
      });
  }

  private loadCommunityData(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    let pendingRequests = 10;
    const finishRequest = () => {
      pendingRequests -= 1;

      if (pendingRequests === 0) {
        this.loadingSignal.set(false);
      }
    };

    this.loadResource(
      this.communityApi.getCommunities(),
      (communities) => this.communitiesSignal.set(communities),
      finishRequest,
    );
    this.loadResource(
      this.communityApi.getCommunityMembers(),
      (members) => this.membersSignal.set(members),
      finishRequest,
    );
    this.loadResource(
      this.communityApi.getCommunityPosts(),
      (posts) => this.postsSignal.set(posts),
      finishRequest,
    );
    this.loadResource(
      this.communityApi.getPostReactions(),
      (reactions) => this.postReactionsSignal.set(reactions),
      finishRequest,
    );
    this.loadResource(
      this.communityApi.getCommunityGoals(),
      (goals) => this.goalsSignal.set(goals),
      finishRequest,
    );
    this.loadResource(
      this.communityApi.getAchievements(),
      (achievements) => this.achievementsSignal.set(achievements),
      finishRequest,
    );
    this.loadResource(
      this.communityApi.getCommunityAchievements(),
      (communityAchievements) =>
        this.communityAchievementsSignal.set(communityAchievements),
      finishRequest,
    );
    this.loadResource(
      this.communityApi.getUserAchievements(),
      (userAchievements) => this.userAchievementsSignal.set(userAchievements),
      finishRequest,
    );
    this.loadResource(
      this.communityApi.getEvents(),
      (events) => this.eventsSignal.set(events),
      finishRequest,
    );
    this.loadResource(
      this.communityApi.getEventRegistrations(),
      (eventRegistrations) => this.eventRegistrationsSignal.set(eventRegistrations),
      finishRequest,
    );
  }

  private loadResource<T>(
    request: Observable<T>,
    applyValue: (value: T) => void,
    finishRequest: () => void,
  ): void {
    request
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (value) => {
          applyValue(value);
          finishRequest();
        },
        error: (error) => {
          this.errorSignal.set(this.formatError(error, 'Could not load the community'));
          this.loadingSignal.set(false);
          finishRequest();
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

  private reactToPost(postId: number, reactionType: CommunityPostReactionType): void {
    const post = this.posts().find((item) => item.id === postId);

    if (!post) {
      return;
    }

    const reaction = new CommunityPostReaction();
    reaction.id = 0;
    reaction.post_id = postId;
    reaction.user_id = this.currentUserId();
    reaction.reaction_type = reactionType;
    reaction.created_at = new Date().toISOString();

    const updatedPost = Object.assign(new CommunityPost(), post, {
      likes: post.likes + 1,
    });

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.communityApi
      .createPostReaction(reaction)
      .pipe(
        switchMap((createdReaction) =>
          this.communityApi.updatePost(updatedPost).pipe(
            map((savedPost) => ({
              createdReaction,
              savedPost,
            })),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ createdReaction, savedPost }) => {
          this.postReactionsSignal.update((reactions) => [...reactions, createdReaction]);
          this.replacePost(savedPost);
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(this.formatError(error, 'Could not react to the post'));
          this.loadingSignal.set(false);
        },
      });
  }

  private updatePostReaction(
    reaction: CommunityPostReaction,
    reactionType: CommunityPostReactionType,
  ): void {
    const updatedReaction = Object.assign(new CommunityPostReaction(), reaction, {
      reaction_type: reactionType,
    });

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.communityApi
      .updatePostReaction(updatedReaction)
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (savedReaction) => {
          this.postReactionsSignal.update((reactions) =>
            reactions.map((item) => (item.id === savedReaction.id ? savedReaction : item)),
          );
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(this.formatError(error, 'Could not update the reaction'));
          this.loadingSignal.set(false);
        },
      });
  }

  private buildPostReactionSummaries(postId: number): CommunityPostReactionSummary[] {
    return this.postReactions()
      .filter((reaction) => reaction.post_id === postId)
      .map((reaction) => {
        const option =
          COMMUNITY_POST_REACTION_OPTIONS.find((item) => item.type === reaction.reaction_type) ??
          COMMUNITY_POST_REACTION_OPTIONS[0];

        return {
          reaction,
          member: this.members().find((member) => member.id === reaction.user_id),
          imageUrl: option.imageUrl,
          labelKey: option.labelKey,
        };
      });
  }

  private findCurrentUserReaction(postId: number): CommunityPostReaction | undefined {
    return this.postReactions().find(
      (reaction) => reaction.post_id === postId && reaction.user_id === this.currentUserId(),
    );
  }

  private replacePost(updatedPost: CommunityPost): void {
    this.postsSignal.update((posts) =>
      posts.map((item) => (item.id === updatedPost.id ? updatedPost : item)),
    );
  }

  private buildEventSummary(event: Event): CommunityEventSummary {
    const registration = this.findCurrentUserRegistration(event.id);

    return {
      event,
      author: this.members().find((member) => member.id === event.author_id),
      registration,
      joined: registration?.status === 'active',
      canDelete: event.author_id === this.currentUserId(),
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
