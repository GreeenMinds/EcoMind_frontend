import { computed, DestroyRef, inject, Injectable, Signal, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, map, of, retry, switchMap } from 'rxjs';
import { CurrentUser } from '../../shared/application/current-user';
import { ActivityUser } from '../domain/model/activity-user.entity';
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
  expired: boolean;
  themeType: string;
}

export interface QuestDetail extends QuestSummary {
  activities: ActivityProgress[];
  minigameAttempts: MinigameAttempt[];
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

  readonly quests = this.questsSignal.asReadonly();
  readonly questsUser = this.questsUserSignal.asReadonly();
  readonly minigames = this.minigamesSignal.asReadonly();
  readonly minigameAttempts = this.minigameAttemptsSignal.asReadonly();
  readonly activities = this.activitiesSignal.asReadonly();
  readonly activitiesUser = this.activitiesUserSignal.asReadonly();

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
    private readonly currentUser: CurrentUser,
  ) {
    this.loadQuestData();
  }

  refresh(): void {
    this.loadQuestData();
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
    return computed(() => this.findCurrentUserActivity(activityId));
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

  startQuest(questId: number): void {
    if (this.findCurrentUserQuest(questId)) {
      return;
    }

    const quest = this.quests().find((item) => item.id === questId);
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
    const questUser = this.findCurrentUserQuest(questId);
    if (!questUser) {
      return;
    }

    questUser.status = 'completed';
    questUser.progress = 100;
    questUser.end_date = this.getTodayDate();
    this.updateQuestUser(questUser, 'Failed to complete quest');
  }

  deleteActiveQuest(questId: number): void {
    const questUser = this.findCurrentUserQuest(questId);
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
    if (this.findCurrentUserActivity(activityId)) {
      return;
    }

    const activityUser = new ActivityUser({
      id: 0,
      user_id: this.currentUserId(),
      activity_id: activityId,
      progress: 0,
      end_date: null,
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
    const activityUser = this.findCurrentUserActivity(activityId);
    if (!activityUser) {
      this.createCompletedActivity(activityId);
      return;
    }

    activityUser.progress = 100;
    activityUser.end_date = this.getTodayDate();
    this.updateActivityUser(activityUser, 'Failed to complete activity', true);
  }

  resetActivity(activityId: number): void {
    const activityUser = this.findCurrentUserActivity(activityId);
    if (!activityUser) {
      return;
    }

    activityUser.progress = 0;
    activityUser.end_date = null;
    this.updateActivityUser(activityUser, 'Failed to reset activity', true);
  }

  recordMinigameAttempt(questId: number, score: number, metadata: Record<string, unknown>): void {
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
    const questUser = this.findCurrentUserQuest(quest.id);
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
      started: Boolean(questUser),
      completed: questUser?.status === 'completed',
      expired: this.isExpired(quest.expiration_date),
      themeType: this.resolveQuestThemeType(quest),
    };
  }

  private buildActivitiesProgress(questId: number): ActivityProgress[] {
    return this.activities()
      .filter((activity) => activity.quest_id === questId)
      .sort((a, b) => a.order - b.order)
      .map((activity) => {
        const activityUser = this.findCurrentUserActivity(activity.id);
        const progress = activityUser?.progress ?? 0;
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

  private findCurrentUserQuest(questId: number): QuestUser | undefined {
    return this.questsUser()
      .filter((questUser) => questUser.quest_id === questId && questUser.user_id === this.currentUserId())
      .sort((a, b) => b.id - a.id)[0];
  }

  private findCurrentUserActivity(activityId: number): ActivityUser | undefined {
    return this.activitiesUser().find(
      (activityUser) =>
        activityUser.activity_id === activityId && activityUser.user_id === this.currentUserId(),
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

  private updateQuestUser(questUser: QuestUser, fallbackMessage: string): void {
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
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(this.formatError(error, fallbackMessage));
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

  private syncQuestProgressFromActivity(activityId: number): void {
    const activity = this.activities().find((item) => item.id === activityId);
    if (!activity) {
      return;
    }

    const questUser = this.findCurrentUserQuest(activity.quest_id);
    if (!questUser || questUser.status === 'completed') {
      return;
    }

    const activities = this.activities().filter((item) => item.quest_id === activity.quest_id);
    const completedActivitiesCount = activities.filter((item) => {
      const activityUser = this.findCurrentUserActivity(item.id);
      return (activityUser?.progress ?? 0) >= 100;
    }).length;

    questUser.progress = this.calculateActivityProgress(activities, completedActivitiesCount);
    questUser.status = questUser.progress >= 100 ? 'ready_to_complete' : 'in_progress';
    questUser.end_date = null;
    this.updateQuestUser(questUser, 'Failed to update quest progress');
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
