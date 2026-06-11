import { computed, DestroyRef, inject, Injectable, Signal, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, retry } from 'rxjs';
import { QuestDailyService } from './quest-daily.service';
import { ProfileApi } from '../../profile/infrastructure/profile-api';
import { Friend } from '../../profile/domain/model/friend.entity';
import { User } from '../../profile/domain/model/user.entity';
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

@Injectable({
  providedIn: 'root',
})
export class QuestsService {
  private readonly destroyRef = inject(DestroyRef);
  readonly questsSignal = signal<Quest[]>([]);

  readonly questsUserSignal = signal<QuestUser[]>([]);
  readonly minigamesSignal = signal<Minigame[]>([]);
  readonly minigameAttemptsSignal = signal<MinigameAttempt[]>([]);
  readonly activitiesSignal = signal<Activity[]>([]);
  readonly activitiesUserSignal = signal<ActivityUser[]>([]);
  readonly collaborativeSessionsSignal = signal<CollaborativeQuestSession[]>([]);
  readonly collaborativeMembersSignal = signal<CollaborativeQuestMember[]>([]);
  readonly usersSignal = signal<User[]>([]);
  readonly friendsSignal = signal<Friend[]>([]);
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
  readonly friends = this.friendsSignal.asReadonly();
  readonly selectedListCategory = this.selectedListCategorySignal.asReadonly();
  readonly selectedListPage = this.selectedListPageSignal.asReadonly();

  readonly loadingSignal = signal<boolean>(false);
  readonly loading = this.loadingSignal.asReadonly();

  readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  readonly currentUserId = computed(() => this.currentUser.getCurrentUserId());

  private completedLoadsCount = 0;

  constructor(
    readonly questsApi: QuestsApi,
    readonly profileApi: ProfileApi,
    readonly currentUser: CurrentUser,
    private readonly questDailyService: QuestDailyService,
  ) {
    this.loadQuests();
    this.loadQuestsUser();
    this.loadMinigames();
    this.loadMinigameAttempts();
    this.loadActivities();
    this.loadActivitiesUser();
    this.loadCollaborativeSessions();
    this.loadCollaborativeMembers();
    this.loadUsers();
    this.loadFriends();

    this.questDailyService.start(this);
    this.destroyRef.onDestroy(() => {
      this.questDailyService.stop();
    });
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

  getQuestById(questId: number): Signal<Quest | undefined> {
    return computed(() => this.quests().find((item) => item.id === questId));
  }

  private updateQuestState(quest: Quest): void {
    const sessionId = this.getCurrentProgressSessionId(quest.id);
    const questUser =
      this.findCurrentUserActiveQuest(quest.id, sessionId) ??
      this.findLatestCurrentUserQuest(quest.id);
    const activities = this.activities().filter((activity) => activity.quest_id === quest.id);
    const completedActivitiesCount = activities.filter((activity) => {
      const progress =
        sessionId === null
          ? (this.findCurrentUserActivity(activity.id, sessionId)?.progress ?? 0)
          : this.getCollaborativeActivityProgress(activity.id, sessionId);
      return progress >= 100;
    }).length;
    const activeQuest = this.findCurrentUserActiveQuest(quest.id, sessionId);

    quest.progress =
      questUser?.progress ?? this.calculateActivityProgress(activities, completedActivitiesCount);
    quest.status = questUser?.status ?? 'pending';
    quest.started = Boolean(activeQuest);
    quest.completed = !activeQuest && questUser?.status === 'completed';
    quest.has_completed_attempt = this.hasCurrentUserCompletedQuest(quest.id);
    quest.activities_count = activities.length;
    quest.completed_activities_count = completedActivitiesCount;
  }

  calculateActivityProgress(activities: Activity[], completedActivitiesCount: number): number {
    if (activities.length === 0) {
      return 0;
    }
    return Math.round((completedActivitiesCount / activities.length) * 100);
  }

  updateAllQuestStates(): void {
    this.quests().forEach((quest) => this.updateQuestState(quest));
    this.questsSignal.update((quests) => [...quests]);
  }

  findCurrentUserActiveQuest(
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

  findLatestCurrentUserQuest(questId: number): QuestUser | undefined {
    return this.questsUser()
      .filter(
        (questUser) => questUser.quest_id === questId && questUser.user_id === this.currentUserId(),
      )
      .sort((a, b) => b.id - a.id)[0];
  }

  hasCurrentUserCompletedQuest(questId: number): boolean {
    return this.questsUser().some(
      (questUser) =>
        questUser.quest_id === questId &&
        questUser.user_id === this.currentUserId() &&
        questUser.status === 'completed',
    );
  }

  findCurrentUserActivity(
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

  mergeById<T extends { id: number }>(existing: T[], updates: T[]): T[] {
    const updatedIds = new Set(updates.map((item) => item.id));
    return [...existing.filter((item) => !updatedIds.has(item.id)), ...updates];
  }

  getCollaborativeActivityProgress(activityId: number, sessionId: number): number {
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

  getCurrentProgressSessionId(questId: number): number | null {
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

  getCurrentActivitySessionId(activityId: number): number | null {
    const activity = this.activities().find((item) => item.id === activityId);
    return activity ? this.getCurrentProgressSessionId(activity.quest_id) : null;
  }

  private loadQuests(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.questsApi
      .getQuests()
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (quests) => {
          this.questsSignal.set(quests);
          this.checkAllLoadsCompleted();
        },
        error: (err) => {
          this.errorSignal.set(this.formatError(err, 'Failed to load quests'));
          this.loadingSignal.set(false);
        },
      });
  }

  private loadQuestsUser(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.questsApi
      .getQuestsUser()
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (questsUser) => {
          this.questsUserSignal.set(questsUser);
          this.checkAllLoadsCompleted();
        },
        error: (err) => {
          this.errorSignal.set(this.formatError(err, 'Failed to load your quests'));
          this.loadingSignal.set(false);
        },
      });
  }

  private loadMinigames(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.questsApi
      .getMinigames()
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (minigames) => {
          this.minigamesSignal.set(minigames);
          this.checkAllLoadsCompleted();
        },
        error: (err) => {
          this.errorSignal.set(this.formatError(err, 'Failed to load minigames'));
          this.loadingSignal.set(false);
        },
      });
  }

  private loadMinigameAttempts(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.questsApi
      .getMinigameAttempts()
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (attempts) => {
          this.minigameAttemptsSignal.set(attempts);
          this.checkAllLoadsCompleted();
        },
        error: (err) => {
          this.errorSignal.set(this.formatError(err, 'Failed to load minigame attempts'));
          this.loadingSignal.set(false);
        },
      });
  }

  private loadActivities(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.questsApi
      .getActivities()
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (activities) => {
          this.activitiesSignal.set(activities);
          this.checkAllLoadsCompleted();
        },
        error: (err) => {
          this.errorSignal.set(this.formatError(err, 'Failed to load activities'));
          this.loadingSignal.set(false);
        },
      });
  }

  private loadActivitiesUser(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.questsApi
      .getActivitiesUser()
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (activitiesUser) => {
          this.activitiesUserSignal.set(activitiesUser);
          this.checkAllLoadsCompleted();
        },
        error: (err) => {
          this.errorSignal.set(this.formatError(err, 'Failed to user activities'));
          this.loadingSignal.set(false);
        },
      });
  }

  private loadCollaborativeSessions(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.questsApi
      .getCollaborativeQuestSessions()
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (sessions) => {
          this.collaborativeSessionsSignal.set(sessions);
          this.checkAllLoadsCompleted();
        },
        error: (err) => {
          this.errorSignal.set(this.formatError(err, 'Failed to load collaborative sessions'));
          this.loadingSignal.set(false);
        },
      });
  }

  private loadCollaborativeMembers(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.questsApi
      .getCollaborativeQuestMembers()
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (members) => {
          this.collaborativeMembersSignal.set(members);
          this.checkAllLoadsCompleted();
        },
        error: (err) => {
          this.errorSignal.set(this.formatError(err, 'Failed to load collaborative members'));
          this.loadingSignal.set(false);
        },
      });
  }

  private loadUsers(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.profileApi
      .getUsers()
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (users) => {
          this.usersSignal.set(users);
          this.checkAllLoadsCompleted();
        },
        error: (err) => {
          this.errorSignal.set(this.formatError(err, 'Failed to load users'));
          this.loadingSignal.set(false);
        },
      });
  }

  private loadFriends(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.profileApi
      .getFriends()
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (friends) => {
          this.friendsSignal.set(friends);
          this.checkAllLoadsCompleted();
        },
        error: (err) => {
          this.errorSignal.set(this.formatError(err, 'Failed to load friends'));
          this.loadingSignal.set(false);
        },
      });
  }

  getTodayDate(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private checkAllLoadsCompleted(): void {
    this.completedLoadsCount++;

    if (this.completedLoadsCount === 10) {
      this.updateAllQuestStates();
      this.questDailyService.syncDailyQuestAssignment();
      this.loadingSignal.set(false);
    }
  }

  formatError(error: unknown, fallback: string): string {
    if (error instanceof Error) {
      return error.message.includes('Resource not found')
        ? `${fallback}: Not found`
        : error.message;
    }
    return fallback;
  }
}
