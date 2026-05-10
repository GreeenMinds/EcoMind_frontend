import { computed, DestroyRef, inject, Injectable, Signal, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, map, Observable, of, retry, switchMap } from 'rxjs';
import { ProfileApi } from '../../profile/infrastructure/profile-api';
import { Friend } from '../../profile/domain/model/friend.entity';
import { User } from '../../profile/domain/model/user.entity';
import { ProfileService } from '../../profile/application/profile.service';
import { CurrentUser } from '../../shared/application/current-user';
import { ActivityUser } from '../domain/model/activity-user.entity';
import { CollaborativeQuestMember } from '../domain/model/collaborative-quest-member.entity';
import { CollaborativeQuestSession } from '../domain/model/collaborative-quest-session.entity';
import { Activity } from '../domain/model/activity.entity';
import { MinigameAttempt } from '../domain/model/minigame-attempt.entity';
import { Minigame } from '../domain/model/minigame.entity';
import { QuestUser } from '../domain/model/quest-user.entity';
import { Quest } from '../domain/model/quest.entity';
import { QuestsApi } from '../infrastructure/quests-api';

export interface ActivityProgress {
  activity: Activity;
  activityUser?: ActivityUser;
  progress: number;
  completed: boolean;
}

export interface QuestSummary {
  quest: Quest;
  questUser?: QuestUser;
  minigame?: Minigame;
  latestMinigameAttempt?: MinigameAttempt;
  progress: number;
  status: string;
  activitiesCount: number;
  completedActivitiesCount: number;
  started: boolean;
  completed: boolean;
  hasCompletedAttempt: boolean;
  expired: boolean;
  themeType: string;
}

export interface QuestDetail extends QuestSummary {
  activities: ActivityProgress[];
  minigameAttempts: MinigameAttempt[];
}

export interface CollaborativeParticipant {
  member: CollaborativeQuestMember;
  user?: User;
  isCurrentUser: boolean;
}

export interface CollaborativeFriendOption {
  user: User;
  alreadyInvited: boolean;
  isBusy: boolean;
  canInvite: boolean;
}

export interface CollaborativeQuestContext {
  session?: CollaborativeQuestSession;
  currentMember?: CollaborativeQuestMember;
  pendingInvitation?: CollaborativeQuestMember;
  participants: CollaborativeParticipant[];
  inviteOptions: CollaborativeFriendOption[];
  isOwner: boolean;
  isAcceptedParticipant: boolean;
  canInvite: boolean;
  canStart: boolean;
  canAcceptInvitation: boolean;
  canLeave: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class QuestsService {
  private readonly destroyRef = inject(DestroyRef);

  private readonly questsSignal = signal<Quest[]>([]);
  private readonly questsUserSignal = signal<QuestUser[]>([]);
  private readonly minigamesSignal = signal<Minigame[]>([]);
  private readonly minigameAttemptsSignal = signal<MinigameAttempt[]>([]);
  private readonly activitiesSignal = signal<Activity[]>([]);
  private readonly activitiesUserSignal = signal<ActivityUser[]>([]);
  private readonly collaborativeSessionsSignal = signal<CollaborativeQuestSession[]>([]);
  private readonly collaborativeMembersSignal = signal<CollaborativeQuestMember[]>([]);
  private readonly usersSignal = signal<User[]>([]);
  private readonly friendsSignal = signal<Friend[]>([]);
  private readonly selectedListCategorySignal = signal('energy');
  private readonly selectedListPageSignal = signal(0);

  readonly quests = this.questsSignal.asReadonly();
  readonly questsUser = this.questsUserSignal.asReadonly();
  readonly minigames = this.minigamesSignal.asReadonly();
  readonly minigameAttempts = this.minigameAttemptsSignal.asReadonly();
  readonly activities = this.activitiesSignal.asReadonly();
  readonly activitiesUser = this.activitiesUserSignal.asReadonly();
  readonly collaborativeSessions = this.collaborativeSessionsSignal.asReadonly();
  readonly collaborativeMembers = this.collaborativeMembersSignal.asReadonly();
  readonly users = this.usersSignal.asReadonly();
  readonly selectedListCategory = this.selectedListCategorySignal.asReadonly();
  readonly selectedListPage = this.selectedListPageSignal.asReadonly();

  private readonly loadingSignal = signal<boolean>(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  readonly questCount = computed(() => this.quests().length);
  readonly activeQuestCount = computed(() => this.getActiveQuests()().length);
  readonly completedQuestCount = computed(() => this.getCompletedQuests()().length);
  readonly currentUserId = computed(() => this.currentUser.getCurrentUserId());

  constructor(
    private readonly questsApi: QuestsApi,
    private readonly profileApi: ProfileApi,
    private readonly profileService: ProfileService,
    private readonly currentUser: CurrentUser,
  ) {
    this.loadQuestData();
  }

  refresh(): void {
    this.loadQuestData();
  }

  selectListCategory(category: string): void {
    if (category !== this.selectedListCategory()) {
      this.selectedListPageSignal.set(0);
    }
    this.selectedListCategorySignal.set(category);
  }

  selectListPage(page: number): void {
    this.selectedListPageSignal.set(page);
  }

  getQuestSummaries(): Signal<QuestSummary[]> {
    return computed(() => this.quests().map((quest) => this.buildQuestSummary(quest)));
  }

  getQuestDetail(questId: number): Signal<QuestDetail | undefined> {
    return computed(() => {
      const quest = this.quests().find((item) => item.id === questId);
      return quest ? this.buildQuestDetail(quest) : undefined;
    });
  }

  getDailyQuest(): Signal<QuestSummary | undefined> {
    // TODO: When the real API supports daily quest scheduling, match the quest by the current date.
    // The fake API only exposes daily quests through the category and expiration date.
    return computed(() =>
      this.getQuestSummaries()().find((summary) => summary.quest.category === 'daily_quest'),
    );
  }

  getActiveQuests(): Signal<QuestSummary[]> {
    return computed(() =>
      this.getQuestSummaries()().filter((summary) => summary.started && !summary.completed),
    );
  }

  getCompletedQuests(): Signal<QuestSummary[]> {
    return computed(() => this.getQuestSummaries()().filter((summary) => summary.completed));
  }

  getPendingQuests(): Signal<QuestSummary[]> {
    return computed(() => this.getQuestSummaries()().filter((summary) => !summary.started));
  }

  getQuestsByCategory(category: string): Signal<QuestSummary[]> {
    return computed(() =>
      this.getQuestSummaries()().filter((summary) => summary.quest.category === category),
    );
  }

  getQuestsByStatus(status: string): Signal<QuestSummary[]> {
    return computed(() =>
      this.getQuestSummaries()().filter((summary) => summary.status === status),
    );
  }

  getQuestsByType(type: string): Signal<QuestSummary[]> {
    return computed(() =>
      this.getQuestSummaries()().filter((summary) => summary.quest.type === type),
    );
  }

  searchQuests(searchTerm: string): Signal<QuestSummary[]> {
    return computed(() => {
      const normalizedSearchTerm = searchTerm.trim().toLowerCase();
      if (!normalizedSearchTerm) {
        return this.getQuestSummaries()();
      }
      return this.getQuestSummaries()().filter(
        (summary) =>
          summary.quest.title.toLowerCase().includes(normalizedSearchTerm) ||
          summary.quest.description.toLowerCase().includes(normalizedSearchTerm) ||
          summary.quest.category.toLowerCase().includes(normalizedSearchTerm) ||
          summary.quest.type.toLowerCase().includes(normalizedSearchTerm),
      );
    });
  }

  getActivitiesForQuest(questId: number): Signal<ActivityProgress[]> {
    return computed(() => this.buildActivitiesProgress(questId));
  }

  getMissingActivitiesForQuest(questId: number): Signal<ActivityProgress[]> {
    return computed(() =>
      this.buildActivitiesProgress(questId).filter((activity) => !activity.completed),
    );
  }

  getActivityFeedback(activityId: number): Signal<ActivityUser | undefined> {
    return computed(() =>
      this.findCurrentUserActivity(activityId, this.getCurrentActivitySessionId(activityId)),
    );
  }

  getLearningHistory(): Signal<QuestSummary[]> {
    return computed(() =>
      this.getQuestSummaries()().filter((summary) => summary.started || summary.completed),
    );
  }

  getUserQuestProgress(questId: number): Signal<number> {
    return computed(() => this.buildQuestSummaryById(questId)?.progress ?? 0);
  }

  getUserQuestStats(): Signal<{
    total: number;
    active: number;
    completed: number;
    pending: number;
    expired: number;
  }> {
    return computed(() => {
      const summaries = this.getQuestSummaries()();
      return {
        total: summaries.length,
        active: summaries.filter((summary) => summary.started && !summary.completed).length,
        completed: summaries.filter((summary) => summary.completed).length,
        pending: summaries.filter((summary) => !summary.started).length,
        expired: summaries.filter((summary) => summary.expired).length,
      };
    });
  }

  getQuestRewardPreview(questId: number): Signal<{ gems: number; ecopoints: number } | undefined> {
    return computed(() => {
      const quest = this.quests().find((item) => item.id === questId);
      return quest ? { gems: quest.reward_gems, ecopoints: quest.reward_ecopoints } : undefined;
    });
  }

  getMinigameAttemptForQuest(questId: number): Signal<MinigameAttempt | undefined> {
    return computed(() => this.findLatestMinigameAttempt(questId));
  }

  getCollaborativeContext(questId: number): Signal<CollaborativeQuestContext> {
    return computed(() => this.buildCollaborativeContext(questId));
  }

  inviteFriendToCollaborativeQuest(questId: number, friendUserId: number): void {
    const quest = this.quests().find((item) => item.id === questId);
    if (!quest || quest.type !== 'collaborative' || this.isUserBusyInQuest(friendUserId, questId)) {
      return;
    }

    const existingSession = this.findCurrentUserOwnedOpenSession(questId);
    if (existingSession) {
      this.createCollaborativeInvitation(existingSession, friendUserId);
      return;
    }

    const session = new CollaborativeQuestSession({
      id: 0,
      quest_id: questId,
      owner_user_id: this.currentUserId(),
      status: 'pending',
      created_at: this.getTodayDate(),
      started_at: null,
      completed_at: null,
    });

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.questsApi
      .createCollaborativeQuestSession(session)
      .pipe(
        switchMap((createdSession) =>
          this.questsApi
            .createCollaborativeQuestMember(this.createOwnerMember(createdSession.id))
            .pipe(map((ownerMember) => ({ createdSession, ownerMember }))),
        ),
        switchMap(({ createdSession, ownerMember }) =>
          this.questsApi
            .createCollaborativeQuestMember(
              this.createInvitedMember(createdSession.id, friendUserId),
            )
            .pipe(map((invitedMember) => ({ createdSession, ownerMember, invitedMember }))),
        ),
        retry(2),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ createdSession, ownerMember, invitedMember }) => {
          this.collaborativeSessionsSignal.update((sessions) => [...sessions, createdSession]);
          this.collaborativeMembersSignal.update((members) => [
            ...members,
            ownerMember,
            invitedMember,
          ]);
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(this.formatError(error, 'Failed to invite friend'));
          this.loadingSignal.set(false);
        },
      });
  }

  acceptCollaborativeInvitation(memberId: number): void {
    const member = this.collaborativeMembers().find((item) => item.id === memberId);
    const session = member
      ? this.collaborativeSessions().find((item) => item.id === member.session_id)
      : undefined;
    if (
      !member ||
      !session ||
      member.status !== 'pending' ||
      session.status !== 'pending' ||
      this.isUserBusyInQuest(member.user_id, session.quest_id)
    ) {
      return;
    }

    member.status = 'accepted';
    member.responded_at = this.getTodayDate();
    this.updateCollaborativeMember(member, 'Failed to accept invitation');
  }

  declineCollaborativeInvitation(memberId: number): void {
    const member = this.collaborativeMembers().find((item) => item.id === memberId);
    if (!member || member.status !== 'pending') {
      return;
    }

    member.status = 'declined';
    member.responded_at = this.getTodayDate();
    this.updateCollaborativeMember(member, 'Failed to decline invitation');
  }

  leaveCollaborativeQuest(memberId: number): void {
    const member = this.collaborativeMembers().find((item) => item.id === memberId);
    if (!member || member.status !== 'accepted') {
      return;
    }

    member.status = 'left';
    member.left_at = this.getTodayDate();
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    const progressToDelete = [
      ...this.questsUser().filter(
        (item) =>
          item.user_id === member.user_id &&
          item.collaborative_session_id === member.session_id &&
          item.status !== 'completed',
      ),
      ...this.activitiesUser().filter(
        (item) =>
          item.user_id === member.user_id && item.collaborative_session_id === member.session_id,
      ),
    ];

    const deleteRequests = progressToDelete.map((progress) =>
      progress instanceof QuestUser
        ? this.questsApi.deleteQuestUser(progress.id)
        : this.questsApi.deleteActivityUser(progress.id),
    );

    forkJoin([
      this.questsApi.updateCollaborativeQuestMember(member),
      ...(deleteRequests.length > 0 ? deleteRequests : [of(undefined)]),
    ])
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([updatedMember]) => {
          this.replaceCollaborativeMember(updatedMember as CollaborativeQuestMember);
          this.questsUserSignal.update((questsUser) =>
            questsUser.filter(
              (item) =>
                !(
                  item.user_id === member.user_id &&
                  item.collaborative_session_id === member.session_id &&
                  item.status !== 'completed'
                ),
            ),
          );
          this.activitiesUserSignal.update((activitiesUser) =>
            activitiesUser.filter(
              (item) =>
                !(
                  item.user_id === member.user_id &&
                  item.collaborative_session_id === member.session_id
                ),
            ),
          );
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(this.formatError(error, 'Failed to leave collaborative quest'));
          this.loadingSignal.set(false);
        },
      });
  }

  removeCollaborativeMember(memberId: number): void {
    const member = this.collaborativeMembers().find((item) => item.id === memberId);
    const session = member
      ? this.collaborativeSessions().find((item) => item.id === member.session_id)
      : undefined;
    if (
      !member ||
      !session ||
      session.owner_user_id !== this.currentUserId() ||
      session.status === 'started' ||
      member.role === 'owner'
    ) {
      return;
    }

    member.status = 'removed';
    member.removed_at = this.getTodayDate();
    this.updateCollaborativeMember(member, 'Failed to remove participant');
  }

  startCollaborativeQuest(questId: number): void {
    const quest = this.quests().find((item) => item.id === questId);
    if (!quest || quest.type !== 'collaborative') {
      return;
    }

    const session = this.findCurrentUserOwnedOpenSession(questId);
    if (session) {
      this.startExistingCollaborativeSession(session);
      return;
    }

    const newSession = new CollaborativeQuestSession({
      id: 0,
      quest_id: questId,
      owner_user_id: this.currentUserId(),
      status: 'pending',
      created_at: this.getTodayDate(),
      started_at: null,
      completed_at: null,
    });

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.questsApi
      .createCollaborativeQuestSession(newSession)
      .pipe(
        switchMap((createdSession) =>
          this.questsApi
            .createCollaborativeQuestMember(this.createOwnerMember(createdSession.id))
            .pipe(map((ownerMember) => ({ createdSession, ownerMember }))),
        ),
        retry(2),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ createdSession, ownerMember }) => {
          this.collaborativeSessionsSignal.update((sessions) => [...sessions, createdSession]);
          this.collaborativeMembersSignal.update((members) => [...members, ownerMember]);
          this.startExistingCollaborativeSession(createdSession);
        },
        error: (error) => {
          this.errorSignal.set(this.formatError(error, 'Failed to start collaborative quest'));
          this.loadingSignal.set(false);
        },
      });
  }

  startQuest(questId: number): void {
    const quest = this.quests().find((item) => item.id === questId);
    if (quest?.type === 'collaborative') {
      this.startCollaborativeQuest(questId);
      return;
    }

    if (this.findCurrentUserActiveQuest(questId, null)) {
      return;
    }

    if (!quest) {
      this.errorSignal.set('Failed to start quest: Not found');
      return;
    }

    const questUser = new QuestUser({
      id: 0,
      user_id: this.currentUserId(),
      quest_id: questId,
      status: 'in_progress',
      progress: 0,
      start_date: this.getTodayDate(),
      end_date: null,
      collaborative_session_id: null,
    });

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.questsApi
      .createQuestUser(questUser)
      .pipe(
        retry(2),
        switchMap((createdQuestUser) => {
          const activitiesToStart =
            quest.type === 'activities'
              ? this.activities().filter((activity) => activity.quest_id === questId)
              : [];

          if (activitiesToStart.length === 0) {
            return of({ createdQuestUser, createdActivitiesUser: [] as ActivityUser[] });
          }

          return forkJoin(
            activitiesToStart.map((activity) =>
              this.questsApi.createActivityUser(
                new ActivityUser({
                  id: 0,
                  user_id: this.currentUserId(),
                  activity_id: activity.id,
                  progress: 0,
                  end_date: null,
                  collaborative_session_id: null,
                }),
              ),
            ),
          ).pipe(map((createdActivitiesUser) => ({ createdQuestUser, createdActivitiesUser })));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ createdQuestUser, createdActivitiesUser }) => {
          this.questsUserSignal.update((questsUser) => [...questsUser, createdQuestUser]);
          this.activitiesUserSignal.update((activitiesUser) => [
            ...activitiesUser,
            ...createdActivitiesUser,
          ]);
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(this.formatError(error, 'Failed to start quest'));
          this.loadingSignal.set(false);
        },
      });
  }

  completeQuest(questId: number): void {
    const sessionId = this.getCurrentProgressSessionId(questId);
    if (sessionId !== null) {
      this.completeCollaborativeQuest(questId, sessionId);
      return;
    }

    const questUser = this.findCurrentUserActiveQuest(questId, sessionId);
    if (!questUser) {
      return;
    }

    const quest = this.quests().find((item) => item.id === questId);
    const rewardUserIds =
      quest && this.shouldAwardQuestReward(quest, questUser.user_id) ? [questUser.user_id] : [];
    questUser.status = 'completed';
    questUser.progress = 100;
    questUser.end_date = this.getTodayDate();
    this.updateQuestUser(questUser, 'Failed to complete quest', quest, rewardUserIds);
  }

  deleteActiveQuest(questId: number): void {
    const questUser = this.findCurrentUserActiveQuest(
      questId,
      this.getCurrentProgressSessionId(questId),
    );
    if (!questUser) {
      return;
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.questsApi
      .deleteQuestUser(questUser.id)
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.questsUserSignal.update((questsUser) =>
            questsUser.filter((item) => item.id !== questUser.id),
          );
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(this.formatError(error, 'Failed to delete active quest'));
          this.loadingSignal.set(false);
        },
      });
  }

  startActivity(activityId: number): void {
    const sessionId = this.getCurrentActivitySessionId(activityId);
    if (this.findCurrentUserActivity(activityId, sessionId)) {
      return;
    }

    const activityUser = new ActivityUser({
      id: 0,
      user_id: this.currentUserId(),
      activity_id: activityId,
      progress: 0,
      end_date: null,
      collaborative_session_id: sessionId,
    });

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.questsApi
      .createActivityUser(activityUser)
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (createdActivityUser) => {
          this.activitiesUserSignal.update((activitiesUser) => [
            ...activitiesUser,
            createdActivityUser,
          ]);
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(this.formatError(error, 'Failed to start activity'));
          this.loadingSignal.set(false);
        },
      });
  }

  completeActivity(activityId: number): void {
    const sessionId = this.getCurrentActivitySessionId(activityId);
    if (sessionId !== null) {
      this.updateCollaborativeActivityProgress(activityId, sessionId, 100);
      return;
    }

    const activityUser = this.findCurrentUserActivity(activityId, sessionId);
    if (!activityUser) {
      this.createCompletedActivity(activityId);
      return;
    }

    activityUser.progress = 100;
    activityUser.end_date = this.getTodayDate();
    this.updateActivityUser(activityUser, 'Failed to complete activity', true);
  }

  resetActivity(activityId: number): void {
    const sessionId = this.getCurrentActivitySessionId(activityId);
    if (sessionId !== null) {
      this.updateCollaborativeActivityProgress(activityId, sessionId, 0);
      return;
    }

    const activityUser = this.findCurrentUserActivity(activityId, sessionId);
    if (!activityUser) {
      return;
    }

    activityUser.progress = 0;
    activityUser.end_date = null;
    this.updateActivityUser(activityUser, 'Failed to reset activity', true);
  }

  recordMinigameAttempt(questId: number, score: number, metadata: Record<string, unknown>): void {
    const quest = this.quests().find((item) => item.id === questId);
    const minigameAttempt = new MinigameAttempt({
      id: 0,
      user_id: this.currentUserId(),
      quest_id: questId,
      score,
      status: 'completed',
      start_date: new Date().toISOString(),
      end_date: new Date().toISOString(),
      metadata,
    });

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.questsApi
      .createMinigameAttempt(minigameAttempt)
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (createdMinigameAttempt) => {
          this.minigameAttemptsSignal.update((minigameAttempts) => [
            ...minigameAttempts,
            createdMinigameAttempt,
          ]);
          if (quest?.type === 'minigame') {
            this.awardQuestRewards(quest, [this.currentUserId()])
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: (users) => this.mergeRewardedUsers(users),
                error: (error) => {
                  this.errorSignal.set(this.formatError(error, 'Failed to award quest rewards'));
                },
              });
          }
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(this.formatError(error, 'Failed to record minigame attempt'));
          this.loadingSignal.set(false);
        },
      });
  }

  private loadQuestData(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    forkJoin({
      quests: this.questsApi.getQuests(),
      questsUser: this.questsApi.getQuestsUser(),
      minigames: this.questsApi.getMinigames(),
      minigameAttempts: this.questsApi.getMinigameAttempts(),
      activities: this.questsApi.getActivities(),
      activitiesUser: this.questsApi.getActivitiesUser(),
      collaborativeSessions: this.questsApi.getCollaborativeQuestSessions(),
      collaborativeMembers: this.questsApi.getCollaborativeQuestMembers(),
      users: this.profileApi.getUsers(),
      friends: this.profileApi.getFriends(),
    })
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.questsSignal.set(data.quests);
          this.questsUserSignal.set(data.questsUser);
          this.minigamesSignal.set(data.minigames);
          this.minigameAttemptsSignal.set(data.minigameAttempts);
          this.activitiesSignal.set(data.activities);
          this.activitiesUserSignal.set(data.activitiesUser);
          this.collaborativeSessionsSignal.set(data.collaborativeSessions);
          this.collaborativeMembersSignal.set(data.collaborativeMembers);
          this.usersSignal.set(data.users);
          this.friendsSignal.set(data.friends);
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(this.formatError(error, 'Failed to load quests'));
          this.loadingSignal.set(false);
        },
      });
  }

  private buildQuestSummaryById(questId: number): QuestSummary | undefined {
    const quest = this.quests().find((item) => item.id === questId);
    return quest ? this.buildQuestSummary(quest) : undefined;
  }

  private buildQuestDetail(quest: Quest): QuestDetail {
    return {
      ...this.buildQuestSummary(quest),
      activities: this.buildActivitiesProgress(quest.id),
      minigameAttempts: this.findCurrentUserMinigameAttempts(quest.id),
    };
  }

  private buildQuestSummary(quest: Quest): QuestSummary {
    const sessionId = this.getCurrentProgressSessionId(quest.id);
    const questUser =
      this.findCurrentUserActiveQuest(quest.id, sessionId) ??
      this.findLatestCurrentUserQuest(quest.id);
    const hasCompletedAttempt = this.hasCurrentUserCompletedQuest(quest.id);
    const activities = this.activities().filter((activity) => activity.quest_id === quest.id);
    const completedActivitiesCount = this.buildActivitiesProgress(quest.id).filter(
      (activity) => activity.completed,
    ).length;
    const latestMinigameAttempt = this.findLatestMinigameAttempt(quest.id);
    const progress =
      questUser?.progress ?? this.calculateActivityProgress(activities, completedActivitiesCount);

    return {
      quest,
      questUser,
      minigame: quest.minigame_id
        ? this.minigames().find((minigame) => minigame.id === quest.minigame_id)
        : undefined,
      latestMinigameAttempt,
      progress,
      status: questUser?.status ?? 'pending',
      activitiesCount: activities.length,
      completedActivitiesCount,
      started: Boolean(this.findCurrentUserActiveQuest(quest.id, sessionId)),
      completed:
        !this.findCurrentUserActiveQuest(quest.id, sessionId) && questUser?.status === 'completed',
      hasCompletedAttempt,
      expired: this.isExpired(quest.expiration_date),
      themeType: this.resolveQuestThemeType(quest),
    };
  }

  private buildActivitiesProgress(questId: number): ActivityProgress[] {
    const sessionId = this.getCurrentProgressSessionId(questId);
    return this.activities()
      .filter((activity) => activity.quest_id === questId)
      .sort((a, b) => a.order - b.order)
      .map((activity) => {
        const activityUser = this.findCurrentUserActivity(activity.id, sessionId);
        const progress =
          sessionId === null
            ? (activityUser?.progress ?? 0)
            : this.getCollaborativeActivityProgress(activity.id, sessionId);
        return {
          activity,
          activityUser,
          progress,
          completed: progress >= 100,
        };
      });
  }

  private calculateActivityProgress(
    activities: Activity[],
    completedActivitiesCount: number,
  ): number {
    if (activities.length === 0) {
      return 0;
    }
    return Math.round((completedActivitiesCount / activities.length) * 100);
  }

  private resolveQuestThemeType(quest: Quest): string {
    if (quest.type === 'minigame') {
      return 'minigame';
    }

    const activities = this.activities().filter((activity) => activity.quest_id === quest.id);
    return (
      activities
        .map((activity) => activity.type)
        .sort((a, b) => this.getActivityTypeWeight(b) - this.getActivityTypeWeight(a))[0] ??
      quest.type
    );
  }

  private getActivityTypeWeight(type: string): number {
    const weights: Record<string, number> = {
      checkbox: 10,
    };

    return weights[type] ?? 0;
  }

  private findCurrentUserActiveQuest(
    questId: number,
    collaborativeSessionId: number | null,
  ): QuestUser | undefined {
    return this.questsUser()
      .filter(
        (questUser) =>
          questUser.quest_id === questId &&
          questUser.user_id === this.currentUserId() &&
          questUser.collaborative_session_id === collaborativeSessionId &&
          questUser.status !== 'completed',
      )
      .sort((a, b) => b.id - a.id)[0];
  }

  private findLatestCurrentUserQuest(questId: number): QuestUser | undefined {
    return this.questsUser()
      .filter(
        (questUser) => questUser.quest_id === questId && questUser.user_id === this.currentUserId(),
      )
      .sort((a, b) => b.id - a.id)[0];
  }

  private hasCurrentUserCompletedQuest(questId: number): boolean {
    return this.questsUser().some(
      (questUser) =>
        questUser.quest_id === questId &&
        questUser.user_id === this.currentUserId() &&
        questUser.status === 'completed',
    );
  }

  private findCurrentUserActivity(
    activityId: number,
    collaborativeSessionId: number | null,
  ): ActivityUser | undefined {
    return this.activitiesUser().find(
      (activityUser) =>
        activityUser.activity_id === activityId &&
        activityUser.user_id === this.currentUserId() &&
        activityUser.collaborative_session_id === collaborativeSessionId,
    );
  }

  private findCurrentUserMinigameAttempts(questId: number): MinigameAttempt[] {
    return this.minigameAttempts().filter(
      (minigameAttempt) =>
        minigameAttempt.quest_id === questId && minigameAttempt.user_id === this.currentUserId(),
    );
  }

  private findLatestMinigameAttempt(questId: number): MinigameAttempt | undefined {
    return this.findCurrentUserMinigameAttempts(questId).sort(
      (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
    )[0];
  }

  private createCompletedActivity(activityId: number): void {
    const activityUser = new ActivityUser({
      id: 0,
      user_id: this.currentUserId(),
      activity_id: activityId,
      progress: 100,
      end_date: this.getTodayDate(),
      collaborative_session_id: this.getCurrentActivitySessionId(activityId),
    });

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.questsApi
      .createActivityUser(activityUser)
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (createdActivityUser) => {
          this.activitiesUserSignal.update((activitiesUser) => [
            ...activitiesUser,
            createdActivityUser,
          ]);
          this.syncQuestProgressFromActivity(activityId);
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(this.formatError(error, 'Failed to complete activity'));
          this.loadingSignal.set(false);
        },
      });
  }

  private updateQuestUser(
    questUser: QuestUser,
    fallbackMessage: string,
    rewardQuest?: Quest,
    rewardUserIds: number[] = [],
  ): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.questsApi
      .updateQuestUser(questUser)
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedQuestUser) => {
          this.questsUserSignal.update((questsUser) =>
            questsUser.map((item) => (item.id === updatedQuestUser.id ? updatedQuestUser : item)),
          );
          if (!rewardQuest || rewardUserIds.length === 0) {
            this.loadingSignal.set(false);
            return;
          }

          this.awardQuestRewards(rewardQuest, rewardUserIds)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (users) => {
                this.mergeRewardedUsers(users);
                this.loadingSignal.set(false);
              },
              error: (error) => {
                this.errorSignal.set(this.formatError(error, 'Failed to award quest rewards'));
                this.loadingSignal.set(false);
              },
            });
        },
        error: (error) => {
          this.errorSignal.set(this.formatError(error, fallbackMessage));
          this.loadingSignal.set(false);
        },
      });
  }

  private completeCollaborativeQuest(questId: number, sessionId: number): void {
    const session = this.collaborativeSessions().find((item) => item.id === sessionId);
    const quest = this.quests().find((item) => item.id === questId);
    if (!session || !quest) {
      return;
    }

    const acceptedUserIds = this.collaborativeMembers()
      .filter((member) => member.session_id === sessionId && member.status === 'accepted')
      .map((member) => member.user_id);
    const rewardUserIds = acceptedUserIds.filter((userId) =>
      this.shouldAwardQuestReward(quest, userId),
    );
    const questUsers = this.questsUser().filter(
      (questUser) =>
        questUser.quest_id === questId &&
        questUser.collaborative_session_id === sessionId &&
        acceptedUserIds.includes(questUser.user_id) &&
        questUser.status !== 'completed',
    );
    questUsers.forEach((questUser) => {
      questUser.status = 'completed';
      questUser.progress = 100;
      questUser.end_date = this.getTodayDate();
    });
    session.status = 'completed';
    session.completed_at = this.getTodayDate();

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    forkJoin({
      session: this.questsApi.updateCollaborativeQuestSession(session),
      questUsers:
        questUsers.length > 0
          ? forkJoin(questUsers.map((questUser) => this.questsApi.updateQuestUser(questUser)))
          : of([]),
      rewardedUsers:
        rewardUserIds.length > 0 ? this.awardQuestRewards(quest, rewardUserIds) : of([]),
    })
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ session: updatedSession, questUsers: updatedQuestUsers, rewardedUsers }) => {
          this.collaborativeSessionsSignal.update((sessions) =>
            sessions.map((item) => (item.id === updatedSession.id ? updatedSession : item)),
          );
          this.questsUserSignal.update((existing) => this.mergeById(existing, updatedQuestUsers));
          this.mergeRewardedUsers(rewardedUsers);
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(this.formatError(error, 'Failed to complete collaborative quest'));
          this.loadingSignal.set(false);
        },
      });
  }

  private updateActivityUser(
    activityUser: ActivityUser,
    fallbackMessage: string,
    syncQuestProgress = false,
  ): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.questsApi
      .updateActivityUser(activityUser)
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedActivityUser) => {
          this.activitiesUserSignal.update((activitiesUser) =>
            activitiesUser.map((item) =>
              item.id === updatedActivityUser.id ? updatedActivityUser : item,
            ),
          );
          if (syncQuestProgress) {
            this.syncQuestProgressFromActivity(updatedActivityUser.activity_id);
          }
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(this.formatError(error, fallbackMessage));
          this.loadingSignal.set(false);
        },
      });
  }

  private updateCollaborativeActivityProgress(
    activityId: number,
    sessionId: number,
    progress: number,
  ): void {
    const activity = this.activities().find((item) => item.id === activityId);
    const session = this.collaborativeSessions().find((item) => item.id === sessionId);
    if (!activity || !session || session.status !== 'started') {
      return;
    }

    const acceptedMembers = this.collaborativeMembers().filter(
      (member) => member.session_id === sessionId && member.status === 'accepted',
    );
    const activityRequests = acceptedMembers.map((member) => {
      const existingActivityUser = this.activitiesUser().find(
        (item) =>
          item.user_id === member.user_id &&
          item.activity_id === activityId &&
          item.collaborative_session_id === sessionId,
      );
      if (existingActivityUser) {
        existingActivityUser.progress = progress;
        existingActivityUser.end_date = progress >= 100 ? this.getTodayDate() : null;
        return this.questsApi.updateActivityUser(existingActivityUser);
      }

      return this.questsApi.createActivityUser(
        new ActivityUser({
          id: 0,
          user_id: member.user_id,
          activity_id: activityId,
          progress,
          end_date: progress >= 100 ? this.getTodayDate() : null,
          collaborative_session_id: sessionId,
        }),
      );
    });
    const nextQuestProgress = this.calculateCollaborativeQuestProgress(
      activity.quest_id,
      sessionId,
      activityId,
      progress,
    );
    const questRequests = acceptedMembers
      .map((member) =>
        this.questsUser().find(
          (item) =>
            item.user_id === member.user_id &&
            item.quest_id === activity.quest_id &&
            item.collaborative_session_id === sessionId &&
            item.status !== 'completed',
        ),
      )
      .filter((questUser): questUser is QuestUser => Boolean(questUser))
      .map((questUser) => {
        questUser.progress = nextQuestProgress;
        questUser.status = nextQuestProgress >= 100 ? 'ready_to_complete' : 'in_progress';
        questUser.end_date = null;
        return this.questsApi.updateQuestUser(questUser);
      });

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    forkJoin({
      activityUsers: activityRequests.length > 0 ? forkJoin(activityRequests) : of([]),
      questUsers: questRequests.length > 0 ? forkJoin(questRequests) : of([]),
    })
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ activityUsers, questUsers }) => {
          this.activitiesUserSignal.update((existing) => this.mergeById(existing, activityUsers));
          this.questsUserSignal.update((existing) => this.mergeById(existing, questUsers));
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(this.formatError(error, 'Failed to update collaborative activity'));
          this.loadingSignal.set(false);
        },
      });
  }

  private mergeById<T extends { id: number }>(existing: T[], updates: T[]): T[] {
    const updatedIds = new Set(updates.map((item) => item.id));
    return [...existing.filter((item) => !updatedIds.has(item.id)), ...updates];
  }

  private calculateCollaborativeQuestProgress(
    questId: number,
    sessionId: number,
    changedActivityId: number,
    changedProgress: number,
  ): number {
    const activities = this.activities().filter((item) => item.quest_id === questId);
    const completedActivitiesCount = activities.filter((activity) => {
      if (activity.id === changedActivityId) {
        return changedProgress >= 100;
      }

      return this.getCollaborativeActivityProgress(activity.id, sessionId) >= 100;
    }).length;
    return this.calculateActivityProgress(activities, completedActivitiesCount);
  }

  private getCollaborativeActivityProgress(activityId: number, sessionId: number): number {
    const acceptedUserIds = this.collaborativeMembers()
      .filter((member) => member.session_id === sessionId && member.status === 'accepted')
      .map((member) => member.user_id);
    return this.activitiesUser()
      .filter(
        (activityUser) =>
          activityUser.activity_id === activityId &&
          activityUser.collaborative_session_id === sessionId &&
          acceptedUserIds.includes(activityUser.user_id),
      )
      .reduce(
        (highestProgress, activityUser) => Math.max(highestProgress, activityUser.progress),
        0,
      );
  }

  private syncQuestProgressFromActivity(activityId: number): void {
    const activity = this.activities().find((item) => item.id === activityId);
    if (!activity) {
      return;
    }

    const sessionId = this.getCurrentActivitySessionId(activityId);
    const questUser = this.findCurrentUserActiveQuest(activity.quest_id, sessionId);
    if (!questUser || questUser.status === 'completed') {
      return;
    }

    const activities = this.activities().filter((item) => item.quest_id === activity.quest_id);
    const completedActivitiesCount = activities.filter((item) => {
      const activityUser = this.findCurrentUserActivity(item.id, sessionId);
      return (activityUser?.progress ?? 0) >= 100;
    }).length;

    questUser.progress = this.calculateActivityProgress(activities, completedActivitiesCount);
    questUser.status = questUser.progress >= 100 ? 'ready_to_complete' : 'in_progress';
    questUser.end_date = null;
    this.updateQuestUser(questUser, 'Failed to update quest progress');
  }

  private buildCollaborativeContext(questId: number): CollaborativeQuestContext {
    const currentUserId = this.currentUserId();
    const visibleSessions = this.collaborativeSessions()
      .filter((session) => session.quest_id === questId)
      .filter((session) =>
        this.collaborativeMembers().some(
          (member) =>
            member.session_id === session.id &&
            member.user_id === currentUserId &&
            ['accepted', 'pending'].includes(member.status),
        ),
      );
    const ownedOpenSession = this.findCurrentUserOwnedOpenSession(questId);
    const acceptedSession = visibleSessions.find((session) =>
      this.collaborativeMembers().some(
        (member) =>
          member.session_id === session.id &&
          member.user_id === currentUserId &&
          member.status === 'accepted',
      ),
    );
    const pendingInvitation = this.findPendingInvitationForCurrentUser(questId);
    const session =
      ownedOpenSession ?? acceptedSession ?? this.findSessionForMember(pendingInvitation);
    const currentMember = session
      ? this.collaborativeMembers().find(
          (member) => member.session_id === session.id && member.user_id === currentUserId,
        )
      : undefined;
    const participants = session ? this.buildParticipants(session.id) : [];
    const inviteOptions = this.buildInviteOptions(questId, session?.id);
    const isOwner = Boolean(session && session.owner_user_id === currentUserId);
    const isAcceptedParticipant = currentMember?.status === 'accepted';
    const acceptedInvites = participants.filter(
      (participant) =>
        participant.member.role !== 'owner' && participant.member.status === 'accepted',
    ).length;
    const pendingInvites = session
      ? this.collaborativeMembers().filter(
          (member) =>
            member.session_id === session.id &&
            member.role !== 'owner' &&
            ['accepted', 'pending'].includes(member.status),
        ).length
      : 0;

    return {
      session,
      currentMember,
      pendingInvitation,
      participants,
      inviteOptions,
      isOwner,
      isAcceptedParticipant,
      canInvite: (!session || (isOwner && session.status === 'pending')) && pendingInvites < 5,
      canStart: isOwner && (!session || session.status === 'pending'),
      canAcceptInvitation: Boolean(
        pendingInvitation &&
        this.findSessionForMember(pendingInvitation)?.status === 'pending' &&
        !this.isUserBusyInQuest(currentUserId, questId),
      ),
      canLeave: isAcceptedParticipant && acceptedInvites >= 0,
    };
  }

  private buildParticipants(sessionId: number): CollaborativeParticipant[] {
    return this.collaborativeMembers()
      .filter(
        (member) =>
          member.session_id === sessionId && ['accepted', 'pending'].includes(member.status),
      )
      .sort((a, b) => this.getMemberOrder(a) - this.getMemberOrder(b))
      .map((member) => ({
        member,
        user: this.users().find((user) => user.id === member.user_id),
        isCurrentUser: member.user_id === this.currentUserId(),
      }));
  }

  private buildInviteOptions(questId: number, sessionId?: number): CollaborativeFriendOption[] {
    const currentUserId = this.currentUserId();
    const friends = this.friendsSignal()
      .filter((friend) => friend.status === 'accepted')
      .map((friend) => (friend.user_id === currentUserId ? friend.friend_id : friend.user_id));
    return [...new Set(friends)]
      .map((friendUserId) => this.users().find((user) => user.id === friendUserId))
      .filter((user): user is User => Boolean(user))
      .map((user) => {
        const alreadyInvited = sessionId
          ? this.collaborativeMembers().some(
              (member) =>
                member.session_id === sessionId &&
                member.user_id === user.id &&
                ['accepted', 'pending'].includes(member.status),
            )
          : false;
        const isBusy = this.isUserBusyInQuest(user.id, questId);
        return {
          user,
          alreadyInvited,
          isBusy,
          canInvite: !alreadyInvited && !isBusy,
        };
      });
  }

  private getMemberOrder(member: CollaborativeQuestMember): number {
    if (member.role === 'owner') {
      return 0;
    }
    if (member.status === 'accepted') {
      return 1;
    }
    return 2;
  }

  private findPendingInvitationForCurrentUser(
    questId: number,
  ): CollaborativeQuestMember | undefined {
    return this.collaborativeMembers().find((member) => {
      const session = this.findSessionForMember(member);
      return (
        member.user_id === this.currentUserId() &&
        member.status === 'pending' &&
        session?.quest_id === questId &&
        session.status === 'pending'
      );
    });
  }

  private findSessionForMember(
    member?: CollaborativeQuestMember,
  ): CollaborativeQuestSession | undefined {
    return member
      ? this.collaborativeSessions().find((session) => session.id === member.session_id)
      : undefined;
  }

  private findCurrentUserOwnedOpenSession(questId: number): CollaborativeQuestSession | undefined {
    return this.collaborativeSessions()
      .filter(
        (session) =>
          session.quest_id === questId &&
          session.owner_user_id === this.currentUserId() &&
          session.status === 'pending',
      )
      .sort((a, b) => b.id - a.id)[0];
  }

  private isUserBusyInQuest(userId: number, questId: number): boolean {
    const hasIndividualActiveQuest = this.questsUser().some(
      (questUser) =>
        questUser.user_id === userId &&
        questUser.quest_id === questId &&
        questUser.collaborative_session_id === null &&
        questUser.status !== 'completed',
    );
    if (hasIndividualActiveQuest) {
      return true;
    }

    return this.collaborativeMembers().some((member) => {
      const session = this.findSessionForMember(member);
      if (
        member.user_id !== userId ||
        member.status !== 'accepted' ||
        session?.quest_id !== questId ||
        !['pending', 'started'].includes(session.status)
      ) {
        return false;
      }

      if (session.status === 'pending') {
        return true;
      }

      return this.questsUser().some(
        (questUser) =>
          questUser.user_id === userId &&
          questUser.quest_id === questId &&
          questUser.collaborative_session_id === session.id &&
          questUser.status !== 'completed',
      );
    });
  }

  private createCollaborativeInvitation(
    session: CollaborativeQuestSession,
    friendUserId: number,
  ): void {
    if (
      session.status !== 'pending' ||
      this.collaborativeMembers().filter(
        (member) =>
          member.session_id === session.id &&
          member.role !== 'owner' &&
          ['accepted', 'pending'].includes(member.status),
      ).length >= 5
    ) {
      return;
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.questsApi
      .createCollaborativeQuestMember(this.createInvitedMember(session.id, friendUserId))
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (createdMember) => {
          this.collaborativeMembersSignal.update((members) => [...members, createdMember]);
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(this.formatError(error, 'Failed to invite friend'));
          this.loadingSignal.set(false);
        },
      });
  }

  private createOwnerMember(sessionId: number): CollaborativeQuestMember {
    return new CollaborativeQuestMember({
      id: 0,
      session_id: sessionId,
      user_id: this.currentUserId(),
      invited_by_user_id: null,
      role: 'owner',
      status: 'accepted',
      invited_at: null,
      responded_at: this.getTodayDate(),
      left_at: null,
      removed_at: null,
    });
  }

  private createInvitedMember(sessionId: number, userId: number): CollaborativeQuestMember {
    return new CollaborativeQuestMember({
      id: 0,
      session_id: sessionId,
      user_id: userId,
      invited_by_user_id: this.currentUserId(),
      role: 'participant',
      status: 'pending',
      invited_at: this.getTodayDate(),
      responded_at: null,
      left_at: null,
      removed_at: null,
    });
  }

  private updateCollaborativeMember(
    member: CollaborativeQuestMember,
    fallbackMessage: string,
  ): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.questsApi
      .updateCollaborativeQuestMember(member)
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedMember) => {
          this.replaceCollaborativeMember(updatedMember);
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(this.formatError(error, fallbackMessage));
          this.loadingSignal.set(false);
        },
      });
  }

  private replaceCollaborativeMember(member: CollaborativeQuestMember): void {
    this.collaborativeMembersSignal.update((members) =>
      members.map((item) => (item.id === member.id ? member : item)),
    );
  }

  private startExistingCollaborativeSession(session: CollaborativeQuestSession): void {
    const acceptedMembers = this.collaborativeMembers().filter(
      (member) => member.session_id === session.id && member.status === 'accepted',
    );
    const pendingMembers = this.collaborativeMembers().filter(
      (member) => member.session_id === session.id && member.status === 'pending',
    );
    const activities = this.activities().filter(
      (activity) => activity.quest_id === session.quest_id,
    );

    session.status = 'started';
    session.started_at = this.getTodayDate();

    const questUserRequests = acceptedMembers.map((member) =>
      this.questsApi.createQuestUser(
        new QuestUser({
          id: 0,
          user_id: member.user_id,
          quest_id: session.quest_id,
          status: 'in_progress',
          progress: 0,
          start_date: this.getTodayDate(),
          end_date: null,
          collaborative_session_id: session.id,
        }),
      ),
    );
    const activityUserRequests = acceptedMembers.flatMap((member) =>
      activities.map((activity) =>
        this.questsApi.createActivityUser(
          new ActivityUser({
            id: 0,
            user_id: member.user_id,
            activity_id: activity.id,
            progress: 0,
            end_date: null,
            collaborative_session_id: session.id,
          }),
        ),
      ),
    );
    const pendingUpdates = pendingMembers.map((member) => {
      member.status = 'declined';
      member.responded_at = this.getTodayDate();
      return this.questsApi.updateCollaborativeQuestMember(member);
    });

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    forkJoin({
      updatedSession: this.questsApi.updateCollaborativeQuestSession(session),
      updatedMembers: pendingUpdates.length > 0 ? forkJoin(pendingUpdates) : of([]),
      createdQuestUsers: questUserRequests.length > 0 ? forkJoin(questUserRequests) : of([]),
      createdActivityUsers:
        activityUserRequests.length > 0 ? forkJoin(activityUserRequests) : of([]),
    })
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ updatedSession, updatedMembers, createdQuestUsers, createdActivityUsers }) => {
          this.collaborativeSessionsSignal.update((sessions) =>
            sessions.map((item) => (item.id === updatedSession.id ? updatedSession : item)),
          );
          updatedMembers.forEach((member) => this.replaceCollaborativeMember(member));
          this.questsUserSignal.update((questsUser) => [...questsUser, ...createdQuestUsers]);
          this.activitiesUserSignal.update((activitiesUser) => [
            ...activitiesUser,
            ...createdActivityUsers,
          ]);
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(this.formatError(error, 'Failed to start collaborative quest'));
          this.loadingSignal.set(false);
        },
      });
  }

  private getCurrentProgressSessionId(questId: number): number | null {
    const session = this.collaborativeSessions()
      .filter((item) => item.quest_id === questId && ['pending', 'started'].includes(item.status))
      .filter((item) =>
        this.collaborativeMembers().some(
          (member) =>
            member.session_id === item.id &&
            member.user_id === this.currentUserId() &&
            member.status === 'accepted',
        ),
      )
      .sort((a, b) => b.id - a.id)[0];
    return session?.id ?? null;
  }

  private getCurrentActivitySessionId(activityId: number): number | null {
    const activity = this.activities().find((item) => item.id === activityId);
    return activity ? this.getCurrentProgressSessionId(activity.quest_id) : null;
  }

  private shouldAwardQuestReward(quest: Quest, userId: number): boolean {
    if (quest.type === 'minigame') {
      return true;
    }

    return !this.questsUser().some(
      (questUser) =>
        questUser.quest_id === quest.id &&
        questUser.user_id === userId &&
        questUser.status === 'completed',
    );
  }

  private awardQuestRewards(quest: Quest, userIds: number[]): Observable<User[]> {
    const uniqueUserIds = [...new Set(userIds)];
    if (uniqueUserIds.length === 0 || (quest.reward_gems === 0 && quest.reward_ecopoints === 0)) {
      return of([]);
    }

    return forkJoin(
      uniqueUserIds.map((userId) =>
        this.profileApi.getUser(userId).pipe(
          switchMap((user) => {
            user.gem_balance += quest.reward_gems;
            user.ecopoints += quest.reward_ecopoints;
            return this.profileApi.updateUser(user);
          }),
        ),
      ),
    );
  }

  private mergeRewardedUsers(users: User[]): void {
    if (users.length === 0) {
      return;
    }

    this.usersSignal.update((existing) => this.mergeById(existing, users));
    users.forEach((user) => this.profileService.syncUser(user));
  }

  private isExpired(expirationDate: string | null): boolean {
    return expirationDate ? new Date(expirationDate).getTime() < Date.now() : false;
  }

  private getTodayDate(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private formatError(error: unknown, fallback: string): string {
    if (error instanceof Error) {
      return error.message.includes('Resource not found')
        ? `${fallback}: Not found`
        : error.message;
    }
    return fallback;
  }
}
