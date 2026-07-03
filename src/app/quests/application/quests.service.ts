import { computed, Injectable, Signal, signal } from '@angular/core';
import { ProfileService } from '../../profile/application/profile.service';
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
import { CollaborativeQuestCountersResource, CollaborativeQuestPermissionsResource} from '../infrastructure/collaborative-quest-session-response';
import { QuestSearchFilters } from '../infrastructure/quest-search-filters';

export type CollaborativeQuestState = {
  session: CollaborativeQuestSession | null;
  members: CollaborativeQuestMember[];
  currentMember: CollaborativeQuestMember | null;
  pendingInvitation: CollaborativeQuestMember | null;
  permissions: CollaborativeQuestPermissionsResource;
  counters: CollaborativeQuestCountersResource;
  unavailableUserIds: number[];
};

@Injectable({
  providedIn: 'root',
})
export class QuestsService {
  readonly questsSignal = signal<Quest[]>([]);
  readonly questSearchResultsSignal = signal<Quest[]>([]);

  readonly questsUserSignal = signal<QuestUser[]>([]);
  readonly minigamesSignal = signal<Minigame[]>([]);
  readonly minigameAttemptsSignal = signal<MinigameAttempt[]>([]);
  readonly activitiesSignal = signal<Activity[]>([]);
  readonly activitiesUserSignal = signal<ActivityUser[]>([]);
  readonly collaborativeSessionsSignal = signal<CollaborativeQuestSession[]>([]);
  readonly collaborativeMembersSignal = signal<CollaborativeQuestMember[]>([]);
  readonly collaborativeStatesSignal = signal<Record<number, CollaborativeQuestState>>({});
  readonly usersSignal = signal<User[]>([]);
  readonly friendsSignal = signal<Friend[]>([]);
  private readonly selectedListCategorySignal = signal('ENERGY');
  private readonly selectedListPageSignal = signal(0);

  readonly quests = this.questsSignal.asReadonly();
  readonly questSearchResults = this.questSearchResultsSignal.asReadonly();
  readonly questsUser = this.questsUserSignal.asReadonly();
  readonly minigames = this.minigamesSignal.asReadonly();
  readonly minigameAttempts = this.minigameAttemptsSignal.asReadonly();
  readonly activities = this.activitiesSignal.asReadonly();
  readonly activitiesUser = this.activitiesUserSignal.asReadonly();
  readonly collaborativeSessions = this.collaborativeSessionsSignal.asReadonly();
  readonly collaborativeMembers = this.collaborativeMembersSignal.asReadonly();
  readonly collaborativeStates = this.collaborativeStatesSignal.asReadonly();
  readonly users = this.usersSignal.asReadonly();
  readonly friends = this.friendsSignal.asReadonly();
  readonly selectedListCategory = this.selectedListCategorySignal.asReadonly();
  readonly selectedListPage = this.selectedListPageSignal.asReadonly();

  readonly loadingSignal = signal<boolean>(false);
  readonly loading = this.loadingSignal.asReadonly();

  readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  readonly currentUserId = computed(() => this.currentUser.getCurrentUserId());
  private readonly requestedActivityUsersByQuestUserId = new Set<number>();

  constructor(
    readonly questsApi: QuestsApi,
    readonly currentUser: CurrentUser,
    private readonly profileService: ProfileService,
  ) {
    this.loadQuests();
    this.loadCurrentUserQuestAssignments();
    this.loadMinigames();
    this.loadSocialContext();
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

  searchQuests(filters: QuestSearchFilters): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.questsApi.searchQuests(filters).subscribe({
      next: (quests) => {
        this.questSearchResultsSignal.set(quests);
        this.questsSignal.update((current) => this.mergeById(current, quests));
        this.updateAllQuestStates();
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.errorSignal.set(this.formatError(err, 'Failed to search quests'));
        this.loadingSignal.set(false);
      },
    });
  }

  private updateQuestState(quest: Quest): void {
    if (quest.type === 'MINIGAME') {
      const successfulAttempt = this.findLatestRewardedMinigameAttempt(quest.id);
      quest.progress = successfulAttempt ? 100 : 0;
      quest.status = successfulAttempt ? 'COMPLETED' : 'PENDING';
      quest.started = false;
      quest.completed = Boolean(successfulAttempt);
      quest.has_completed_attempt = Boolean(successfulAttempt);
      return;
    }

    const sessionId = this.getCurrentProgressSessionId(quest.id);
    const questUser =
      this.findCurrentUserActiveQuest(quest.id, sessionId) ??
      this.findLatestCurrentUserQuest(quest.id);

    quest.progress = questUser?.progress ?? 0;
    quest.status = questUser?.status ?? 'PENDING';
    quest.started = Boolean(questUser && questUser.status !== 'COMPLETED');
    quest.completed = questUser?.status === 'COMPLETED';
    quest.has_completed_attempt = this.hasCurrentUserCompletedQuest(quest.id);
  }

  updateAllQuestStates(): void {
    this.quests().forEach((quest) => this.updateQuestState(quest));
    this.questsSignal.update((quests) => [...quests]);
    this.questSearchResults().forEach((quest) => this.updateQuestState(quest));
    this.questSearchResultsSignal.update((quests) => [...quests]);
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
          questUser.status !== 'COMPLETED',
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

  findLatestRewardedMinigameAttempt(questId: number): MinigameAttempt | undefined {
    return this.minigameAttempts()
      .filter(
        (attempt) =>
          attempt.quest_id === questId &&
          attempt.user_id === this.currentUserId() &&
          attempt.status === 'COMPLETED' &&
          (attempt.givenGems > 0 || attempt.givenEcopoints > 0),
      )
      .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())[0];
  }

  replaceMinigameAttempt(attempt: MinigameAttempt): void {
    this.minigameAttemptsSignal.update((attempts) => this.mergeById(attempts, [attempt]));
    this.updateAllQuestStates();
  }

  refreshCurrentUserProfile(): void {
    this.profileService.refreshCurrentUser().subscribe({
      error: (err) => {
        this.errorSignal.set(this.formatError(err, 'Failed to refresh current user'));
      },
    });
  }

  findLatestCurrentUserActiveQuest(questId: number): QuestUser | undefined {
    return this.questsUser()
      .filter(
        (questUser) =>
          questUser.quest_id === questId &&
          questUser.user_id === this.currentUserId() &&
          questUser.status !== 'COMPLETED',
      )
      .sort((a, b) => b.id - a.id)[0];
  }

  findActiveQuestForSession(
    questId: number,
    collaborativeSessionId: number | null,
  ): QuestUser | undefined {
    return (
      this.findCurrentUserActiveQuest(questId, collaborativeSessionId) ??
      this.findLatestCurrentUserActiveQuest(questId)
    );
  }

  hasCurrentUserCompletedQuest(questId: number): boolean {
    return this.questsUser().some(
      (questUser) =>
        questUser.quest_id === questId &&
        questUser.user_id === this.currentUserId() &&
        questUser.status === 'COMPLETED',
    );
  }

  findCurrentUserActivity(
    activityId: number,
    collaborativeSessionId: number | null,
  ): ActivityUser | undefined {
    const activity = this.activities().find((item) => item.id === activityId);
    const questUser = activity
      ? this.findActiveQuestForSession(activity.quest_id, collaborativeSessionId)
      : undefined;
    return this.activitiesUser().find(
      (activityUser) =>
        activityUser.activity_id === activityId &&
        activityUser.quest_user_id === questUser?.id &&
        activityUser.collaborative_session_id === questUser?.collaborative_session_id,
    );
  }

  mergeById<T extends { id: number }>(existing: T[], updates: T[]): T[] {
    const updatedIds = new Set(updates.map((item) => item.id));
    return [...existing.filter((item) => !updatedIds.has(item.id)), ...updates];
  }

  getCollaborativeActivityProgress(activityId: number, sessionId: number): number {
    const acceptedQuestUserIds = this.questsUser()
      .filter(
        (questUser) =>
          questUser.collaborative_session_id === sessionId && questUser.status !== 'COMPLETED',
      )
      .map((questUser) => questUser.id);
    let highestProgress = 0;
    this.activitiesUser().forEach((activityUser) => {
      if (
        activityUser.activity_id === activityId &&
        activityUser.collaborative_session_id === sessionId &&
        acceptedQuestUserIds.includes(activityUser.quest_user_id) &&
        activityUser.progress > highestProgress
      ) {
        highestProgress = activityUser.progress;
      }
    });
    return highestProgress;
  }

  getCurrentProgressSessionId(questId: number): number | null {
    const session = this.collaborativeSessions()
      .filter((item) => item.quest_id === questId && ['PENDING', 'STARTED'].includes(item.status))
      .filter((item) =>
        this.collaborativeMembers().some(
          (member) =>
            member.session_id === item.id &&
            member.user_id === this.currentUserId() &&
            member.status === 'ACCEPTED',
        ),
      )
      .sort((a, b) => b.id - a.id)[0];
    return session?.id ?? null;
  }

  getCurrentActivitySessionId(activityId: number): number | null {
    const activity = this.activities().find((item) => item.id === activityId);
    if (!activity) {
      return null;
    }

    return (
      this.getCurrentProgressSessionId(activity.quest_id) ??
      this.findLatestCurrentUserActiveQuest(activity.quest_id)?.collaborative_session_id ??
      null
    );
  }

  private loadQuests(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.questsApi.getQuests().subscribe({
      next: (quests) => {
        this.questsSignal.set(quests);
        this.questSearchResultsSignal.set(quests);
        this.updateAllQuestStates();
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.errorSignal.set(this.formatError(err, 'Failed to load quests'));
        this.loadingSignal.set(false);
      },
    });
  }

  private loadCurrentUserQuestAssignments(): void {
    this.questsUserSignal.set([]);
    ['IN_PROGRESS', 'READY_TO_COMPLETE', 'COMPLETED'].forEach((status) => {
      this.questsApi.getQuestUsersByUserAndStatus(this.currentUserId(), status).subscribe({
        next: (questsUser) => {
          this.questsUserSignal.update((current) => this.mergeById(current, questsUser));
          questsUser
            .filter((questUser) => questUser.status !== 'COMPLETED')
            .forEach((questUser) => this.loadActivityUsersByQuestUserId(questUser.id));
          this.updateAllQuestStates();
        },
        error: (err) => {
          this.errorSignal.set(this.formatError(err, 'Failed to load your quests'));
        },
      });
    });
  }

  private loadMinigames(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.questsApi.getMinigames().subscribe({
      next: (minigames) => {
        this.minigamesSignal.set(minigames);
        this.loadCurrentUserMinigameAttempts();
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.errorSignal.set(this.formatError(err, 'Failed to load minigames'));
        this.loadingSignal.set(false);
      },
    });
  }

  private loadCurrentUserMinigameAttempts(): void {
    this.minigameAttemptsSignal.set([]);
    this.minigames().forEach((minigame) => {
      this.questsApi
        .getMinigameAttemptsByUserAndMinigame(this.currentUserId(), minigame.id)
        .subscribe({
          next: (attempts) => {
            this.minigameAttemptsSignal.update((current) => this.mergeById(current, attempts));
            this.updateAllQuestStates();
          },
          error: (err) => {
            this.errorSignal.set(this.formatError(err, 'Failed to load minigame attempts'));
          },
        });
    });
  }

  private loadSocialContext(): void {
    this.profileService.getUsers().subscribe({
      next: (users) => this.usersSignal.set(users),
      error: (err) => {
        this.errorSignal.set(this.formatError(err, 'Failed to load users'));
      },
    });

    this.profileService.getFriends().subscribe({
      next: (friends) => this.friendsSignal.set(friends),
      error: (err) => {
        this.errorSignal.set(this.formatError(err, 'Failed to load friends'));
      },
    });
  }

  loadActivitiesByQuestId(questId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.questsApi.getActivitiesByQuestId(questId).subscribe({
      next: (activities) => {
        this.activitiesSignal.update((current) => this.mergeById(current, activities));
        const questUser = this.findCurrentUserActiveQuest(questId, this.getCurrentProgressSessionId(questId));
        if (questUser) {
          this.loadActivityUsersByQuestUserId(questUser.id);
        }
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.errorSignal.set(this.formatError(err, 'Failed to load activities'));
        this.loadingSignal.set(false);
      },
    });
  }

  loadActivityUsersByQuestUserId(questUserId: number): void {
    if (this.requestedActivityUsersByQuestUserId.has(questUserId)) {
      return;
    }

    this.requestedActivityUsersByQuestUserId.add(questUserId);
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.questsApi.getActivityUsersByQuestUserId(questUserId).subscribe({
      next: (activitiesUser) => {
        this.activitiesUserSignal.update((current) => this.mergeById(current, activitiesUser));
        this.updateAllQuestStates();
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.requestedActivityUsersByQuestUserId.delete(questUserId);
        this.errorSignal.set(this.formatError(err, 'Failed to load activity progress'));
        this.loadingSignal.set(false);
      },
    });
  }

  getTodayDate(): string {
    return new Date().toISOString().slice(0, 10);
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
