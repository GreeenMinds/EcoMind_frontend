import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, retry, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CurrentUser } from '../../shared/application/current-user';
import { Friend } from '../../profile/domain/model/friend.entity';
import { FamilyUser } from '../../profile/domain/model/family-user.entity';
import { ProfileApi } from '../../profile/infrastructure/profile-api';
import { User } from '../../profile/domain/model/user.entity';
import { Achievement } from '../domain/model/achievement.entity';
import { CommunityAchievement } from '../domain/model/community-achievement.entity';
import { CommunityGoal } from '../domain/model/community-goal.entity';
import { Goal } from '../domain/model/goal.entity';
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
import { Quest } from '../../quests/domain/model/quest.entity';
import { QuestUser } from '../../quests/domain/model/quest-user.entity';
import { QuestsApi } from '../../quests/infrastructure/quests-api';

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
  communityAchievement: CommunityAchievement;
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
  private readonly communityAchievementTypes = new Set([
    'COMMUNITY_MEMBERS_COUNT',
    'COMMUNITY_POSTS_COUNT',
    'COMMUNITY_EVENTS_COUNT',
  ]);

  private readonly communitiesSignal = signal<Community[]>([]);
  private readonly membersSignal = signal<CommunityMember[]>([]);
  private readonly postsSignal = signal<CommunityPost[]>([]);
  private readonly postReactionsSignal = signal<CommunityPostReaction[]>([]);
  private readonly goalCatalogSignal = signal<Goal[]>([]);
  private readonly goalsSignal = signal<CommunityGoal[]>([]);
  private readonly questsSignal = signal<Quest[]>([]);
  private readonly questUsersSignal = signal<QuestUser[]>([]);
  private readonly achievementsSignal = signal<Achievement[]>([]);
  private readonly communityAchievementsSignal = signal<CommunityAchievement[]>([]);
  private readonly userAchievementsSignal = signal<UserAchievement[]>([]);
  private readonly eventsSignal = signal<Event[]>([]);
  private readonly eventRegistrationsSignal = signal<EventRegistration[]>([]);
  private readonly familyUsersSignal = signal<FamilyUser[]>([]);
  private readonly realMembersSignal = signal<Map<number, CommunityMember>>(new Map());

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
  readonly familyUsers = this.familyUsersSignal.asReadonly();

  private readonly loadingSignal = signal<boolean>(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  readonly currentUserId = computed(() => this.currentUser.getCurrentUserId());

  readonly currentMember = computed(() =>
    this.realMembersSignal().get(this.currentUserId()) ??
    this.members().find((member) => member.id === this.currentUserId()),
  );

  readonly currentCommunityId = computed(() => this.currentMember()?.community_id ?? null);

  readonly currentFamilyMembership = computed(
    () => this.familyUsers().find((membership) => membership.user_id === this.currentUserId()) ?? null,
  );

  readonly currentFamilyId = computed(() => this.currentFamilyMembership()?.family_id ?? null);

  readonly communityGoals = computed(() => {
    const communityId = this.currentCommunityId();

    return this.goals()
      .filter((goal) => communityId !== null && goal.community_id === communityId)
      .map((goal) => this.buildCommunityGoal(goal))
      .filter((goal) => goal.status !== 'completed');
  });

  readonly postSummaries = computed(() => {
    const communityId = this.currentCommunityId();
    const realMembers = this.realMembersSignal();

    return this.posts()
      .filter((post) => communityId !== null && post.community_id === communityId)
      .map((post) => ({
        post,
        author:
          realMembers.get(post.user_id) ??
          this.members().find((member) => member.id === post.user_id),
      }))
      .sort((a, b) => new Date(b.post.created_at).getTime() - new Date(a.post.created_at).getTime())
      .map(({ post, author }) => ({
        post,
        author,
        reactions: this.buildPostReactionSummaries(post.id),
        currentUserReaction: this.findCurrentUserReaction(post.id),
      }));
  });

  readonly eventSummaries = computed(() => {
    const communityId = this.currentCommunityId();

    return this.events()
      .filter((event) => communityId !== null && event.community_id === communityId)
      .slice()
      .sort(
        (a, b) =>
          new Date(`${a.date}T${a.start_time}`).getTime() -
          new Date(`${b.date}T${b.start_time}`).getTime(),
      )
      .map((event) => this.buildEventSummary(event));
  });

  readonly joinedEvents = computed(() => this.eventSummaries().filter((summary) => summary.joined));

  readonly availableEvents = computed(() =>
    this.eventSummaries().filter((summary) => !summary.joined),
  );

  readonly achievementSummaries = computed<CommunityAchievementSummary[]>(() => {
    const communityId = this.currentCommunityId();
    const summaries: CommunityAchievementSummary[] = [];

    this.communityAchievements().forEach((communityAchievement) => {
      if (communityId === null || communityAchievement.community_id !== communityId) {
        return;
      }

      const achievement = this.achievements().find(
        (item) => item.id === communityAchievement.achievement_id,
      );

      if (!achievement || !this.isCommunityScopedAchievement(achievement)) {
        return;
      }

      summaries.push({
        achievement,
        communityAchievement,
        date: communityAchievement.date,
      });
    });

    return summaries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });
  constructor(
    private readonly communityApi: CommunityApi,
    private readonly questsApi: QuestsApi,
    private readonly currentUser: CurrentUser,
    private readonly profileApi: ProfileApi,
    private readonly http: HttpClient,
  ) {
    this.loadCommunityData();
  }

  private loadRealMembers(userIds: number[]): void {
    const knownIds = new Set(this.realMembersSignal().keys());
    const missingIds = [...new Set(userIds)].filter((id) => !knownIds.has(id));

    missingIds.forEach((userId) => {
      this.profileApi.getUser(userId).subscribe({
        next: (member) =>
          this.realMembersSignal.update((members) =>
            new Map(members).set(userId, this.toCommunityMember(member)),
          ),
        error: () => {},
      });
    });
  }

  private toCommunityMember(user: User): CommunityMember {
    return Object.assign(new CommunityMember(), {
      id: user.id,
      community_id: user.community_id,
      email: user.email,
      birth_date: user.birth_date,
      name: user.name,
      streak: user.streak,
      commitment: user.commitment,
      registered_at: user.registered_at,
      gem_balance: user.gem_balance,
      ecopoints: user.ecopoints,
    });
  }

  refresh(): void {
    this.loadCommunityData();
  }

  refreshCurrentUserAchievements(): Observable<UserAchievement[]> {
    return this.refreshUserAchievements(this.currentUserId());
  }

  refreshUserAchievements(userId: number): Observable<UserAchievement[]> {
    return this.communityApi.getUserAchievementsByUserId(userId).pipe(
      tap((userAchievements) => {
        this.userAchievementsSignal.update((current) =>
          this.mergeById(
            current.filter((achievement) => achievement.user_id !== userId),
            userAchievements,
          ),
        );
        this.loadRealMembers(userAchievements.map((achievement) => achievement.user_id));
      }),
    );
  }

  refreshCurrentCommunityAchievements(): Observable<CommunityAchievement[]> {
    const communityId = this.currentCommunityId();

    if (communityId === null) {
      return of([]);
    }

    return this.communityApi.getCommunityAchievementsByCommunityId(communityId).pipe(
      tap((communityAchievements) => {
        this.communityAchievementsSignal.update((current) =>
          this.mergeById(
            current.filter((achievement) => achievement.community_id !== communityId),
            communityAchievements,
          ),
        );
      }),
    );
  }

  filterCommunityScopedAchievements(communityAchievements: CommunityAchievement[]): CommunityAchievement[] {
    return communityAchievements.filter((communityAchievement) => {
      const achievement = this.achievements().find(
        (item) => item.id === communityAchievement.achievement_id,
      );

      return achievement ? this.isCommunityScopedAchievement(achievement) : false;
    });
  }

  joinEventAsIndividual(eventId: number): void {
    this.createRegistration(eventId, 'individual', null);
  }

  joinEventAsFamily(eventId: number): Observable<boolean> {
    const familyId = this.currentFamilyId();

    if (familyId !== null) {
      this.createRegistration(eventId, 'family', familyId);
      return of(true);
    }

    return this.profileApi.getFamilyUsers().pipe(
      tap((familyUsers) => this.familyUsersSignal.set(familyUsers)),
      map(() => {
        const refreshedFamilyId = this.currentFamilyId();

        if (refreshedFamilyId === null) {
          return false;
        }

        this.createRegistration(eventId, 'family', refreshedFamilyId);
        return true;
      }),
      catchError(() => of(false)),
    );
  }

  cancelEventRegistration(eventId: number): void {
    const registration = this.findCurrentUserRegistration(eventId);

    if (!registration) {
      return;
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.communityApi
      .cancelEventRegistration(registration)
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
    const communityId = this.currentCommunityId();

    if (communityId === null) {
      this.errorSignal.set('Could not create the event: community is not available');
      return;
    }

    const event = new Event();

    event.id = 0;
    event.community_id = communityId;
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
      .deleteEvent(eventId, this.currentUserId())
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
    const communityId = this.currentCommunityId();

    if (communityId === null) {
      this.errorSignal.set('Could not create the post: community is not available');
      return;
    }

    const post = new CommunityPost();

    post.id = 0;
    post.community_id = communityId;
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
          this.loadRealMembers([createdPost.user_id]);
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(this.formatError(error, 'Could not create the post'));
          this.loadingSignal.set(false);
        },
      });
  }

  shareAchievement(postData: CommunityPostFormValue): Observable<CommunityPost> {
    const communityId = this.currentCommunityId();

    if (communityId === null) {
      return throwError(() => new Error('Could not share the achievement: community is not available'));
    }

    const realPostsUrl =
      `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderCommunityPostRealEndpointPath}`;

    const payload = {
      community_id: communityId,
      user_id: this.currentUserId(),
      content: postData.content,
      points: postData.points,
      image_url: postData.image_url,
    };

    return this.http.post<CommunityPost>(realPostsUrl, payload).pipe(
      tap((createdPost) => {
        this.postsSignal.update((posts) => [...posts, createdPost]);
        this.loadRealMembers([createdPost.user_id]);
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

    if (!reaction) {
      return;
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.communityApi
      .deletePostReaction(reaction.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.postReactionsSignal.update((reactions) =>
            reactions.filter((item) => item.id !== reaction.id),
          );
          this.adjustPostLikes(postId, -1);
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
    this.loadRealMembers([this.currentUserId()]);

    let pendingRequests = 11;
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
    this.loadOptionalResource(
      this.profileApi.getFamilyUsers(),
      [],
      (familyUsers) => this.familyUsersSignal.set(familyUsers),
      finishRequest,
    );
    this.loadResource(
      this.communityApi.getCommunityPosts(),
      (posts) => {
        this.postsSignal.set(posts);
        this.loadRealMembers(posts.map((post) => post.user_id));
      },
      finishRequest,
    );
    this.loadResource(
      this.communityApi.getPostReactions(),
      (reactions) => {
        this.postReactionsSignal.set(reactions);
        this.loadRealMembers(reactions.map((reaction) => reaction.user_id));
      },
      finishRequest,
    );
    this.loadResource(
      this.communityApi.getGoals(),
      (goals) => this.goalCatalogSignal.set(goals),
      finishRequest,
    );
    this.loadResource(
      this.communityApi.getCommunityGoals(),
      (goals) => this.goalsSignal.set(goals),
      finishRequest,
    );
    this.loadOptionalResource(
      this.questsApi.getQuests(),
      [],
      (quests) => this.questsSignal.set(quests),
      finishRequest,
    );
    this.loadOptionalResource(
      of([] as QuestUser[]),
      [],
      (questUsers) => this.questUsersSignal.set(questUsers),
      finishRequest,
    );
    this.loadResource(
      this.communityApi.getAchievements(),
      (achievements) => this.achievementsSignal.set(achievements),
      finishRequest,
    );
    this.loadResource(
      this.communityApi.getEvents().pipe(
        tap((events) => {
          this.eventsSignal.set(events);
          this.loadRealMembers(events.map((event) => event.author_id));
        }),
        switchMap((events) =>
          this.communityApi.getEventRegistrationsForEvents(events.map((event) => event.id)),
        ),
      ),
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

  private loadOptionalResource<T>(
    request: Observable<T>,
    fallback: T,
    applyValue: (value: T) => void,
    finishRequest: () => void,
  ): void {
    request
      .pipe(
        retry(2),
        catchError(() => of(fallback)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (value) => {
          applyValue(value);
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

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.communityApi
      .createPostReaction(reaction)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (createdReaction) => {
          this.postReactionsSignal.update((reactions) => [...reactions, createdReaction]);
          this.loadRealMembers([createdReaction.user_id]);
          this.adjustPostLikes(postId, 1);
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
    const realMembers = this.realMembersSignal();

    return this.postReactions()
      .filter((reaction) => reaction.post_id === postId)
      .map((reaction) => {
        const option =
          COMMUNITY_POST_REACTION_OPTIONS.find((item) => item.type === reaction.reaction_type) ??
          COMMUNITY_POST_REACTION_OPTIONS[0];

        return {
          reaction,
          member:
            realMembers.get(reaction.user_id) ??
            this.members().find((member) => member.id === reaction.user_id),
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

  private adjustPostLikes(postId: number, delta: number): void {
    this.postsSignal.update((posts) =>
      posts.map((post) =>
        post.id === postId
          ? Object.assign(new CommunityPost(), post, {
              likes: Math.max(0, post.likes + delta),
            })
          : post,
      ),
    );
  }

  private buildEventSummary(event: Event): CommunityEventSummary {
    const registration = this.findCurrentUserRegistration(event.id);
    const realMembers = this.realMembersSignal();

    return {
      event,
      author:
        realMembers.get(event.author_id) ??
        this.members().find((member) => member.id === event.author_id),
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

  private buildCommunityGoal(goal: CommunityGoal): CommunityGoal {
    const catalogGoal = this.goalCatalogSignal().find((item) => item.id === goal.goal_id);
    const stats = this.calculateGoalStats(goal, catalogGoal?.quest_category ?? '');
    const progress = stats?.progress ?? goal.progress;
    const participants = stats?.participants ?? goal.participants;

    return Object.assign(new CommunityGoal(), goal, {
      title: catalogGoal?.title ?? '',
      unit: catalogGoal?.unit ?? '',
      progress,
      participants,
      status: progress >= goal.target ? 'completed' : goal.status,
    });
  }

  private isCommunityScopedAchievement(achievement: Achievement): boolean {
    return this.communityAchievementTypes.has(achievement.type);
  }

  private mergeById<T extends { id: number }>(current: T[], incoming: T[]): T[] {
    const merged = new Map<number, T>();
    current.forEach((item) => merged.set(item.id, item));
    incoming.forEach((item) => merged.set(item.id, item));
    return Array.from(merged.values());
  }

  private calculateGoalStats(
    communityGoal: CommunityGoal,
    questCategory: string,
  ): { progress: number; participants: number } | null {
    const category = this.normalizeText(questCategory);

    if (!category || this.questsSignal().length === 0 || this.questUsersSignal().length === 0) {
      return null;
    }

    const communityUserIds = new Set(
      this.members()
        .filter((member) => member.community_id === communityGoal.community_id)
        .map((member) => member.id),
    );
    const questIds = new Set(
      this.questsSignal()
        .filter((quest) => this.normalizeText(quest.category) === category)
        .map((quest) => quest.id),
    );
    const completedAssignments = this.questUsersSignal().filter(
      (questUser) =>
        questIds.has(questUser.quest_id) &&
        this.isQuestCompleted(questUser) &&
        (communityUserIds.size === 0 || communityUserIds.has(questUser.user_id)),
    );

    return {
      progress: completedAssignments.length,
      participants: new Set(completedAssignments.map((questUser) => questUser.user_id)).size,
    };
  }

  private isQuestCompleted(questUser: QuestUser): boolean {
    return this.normalizeText(questUser.status) === 'completed' || questUser.progress >= 100;
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
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
