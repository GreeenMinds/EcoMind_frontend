import { Injectable } from '@angular/core';
import { Observable, retry } from 'rxjs';
import { ActivityUser } from '../domain/model/activity-user.entity';
import { QuestUser } from '../domain/model/quest-user.entity';
import { Quest } from '../domain/model/quest.entity';
import type { QuestsService } from './quests.service';

@Injectable({
  providedIn: 'root',
})
export class QuestDailyService {
  private dailyQuestTimerId: ReturnType<typeof setTimeout> | null = null;
  private questsService?: QuestsService;

  start(questsService: QuestsService): void {
    this.questsService = questsService;
    this.scheduleNextDailyQuestSync();
  }

  stop(): void {
    if (this.dailyQuestTimerId) {
      clearTimeout(this.dailyQuestTimerId);
    }
  }

  private get data(): QuestsService {
    if (!this.questsService) {
      throw new Error('Quest daily service has not started');
    }
    return this.questsService;
  }

  private scheduleNextDailyQuestSync(): void {
    if (this.dailyQuestTimerId) {
      clearTimeout(this.dailyQuestTimerId);
    }

    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(0, 0, 0, 0);
    if (now >= nextMidnight) {
      nextMidnight.setDate(nextMidnight.getDate() + 1);
    }

    this.dailyQuestTimerId = setTimeout(() => {
      this.syncDailyQuestAssignment(true);
      this.scheduleNextDailyQuestSync();
    }, nextMidnight.getTime() - now.getTime());
  }

  syncDailyQuestAssignment(_force = false): void {
    const today = this.data.getTodayDate();
    const currentUserId = this.data.currentUserId();
    const dailyQuestIds = new Set(
      this.data
        .quests()
        .filter((quest) => quest.category === 'daily_quest')
        .map((quest) => quest.id),
    );
    const userDailyQuestUsers = this.data
      .questsUser()
      .filter(
        (questUser) => questUser.user_id === currentUserId && dailyQuestIds.has(questUser.quest_id),
      );

    if (
      userDailyQuestUsers.some(
        (questUser) => questUser.start_date === today || questUser.end_date === today,
      )
    ) {
      return;
    }

    const staleQuestUsers = userDailyQuestUsers.filter(
      (questUser) => questUser.status !== 'completed',
    );
    const dailyQuest = this.pickDailyQuestForDate(today);
    if (!dailyQuest) {
      return;
    }

    const createDailyQuest = () => this.createDailyQuestAssignment(dailyQuest);
    if (staleQuestUsers.length === 0) {
      createDailyQuest();
      return;
    }

    this.data.loadingSignal.set(true);
    this.data.errorSignal.set(null);

    const deletionRequests = this.buildDailyQuestDeletionRequests(staleQuestUsers);
    let completedDeletes = 0;

    deletionRequests.forEach((request) => {
      request.pipe(retry(2)).subscribe({
        next: () => {
          completedDeletes++;

          if (completedDeletes === deletionRequests.length) {
            const staleQuestUserIds = new Set(staleQuestUsers.map((questUser) => questUser.id));
            const staleActivityUserIds = new Set(
              this.data
                .activitiesUser()
                .filter((activityUser) =>
                  staleQuestUsers.some((questUser) =>
                    this.data
                      .activities()
                      .some(
                        (activity) =>
                          activity.id === activityUser.activity_id &&
                          activity.quest_id === questUser.quest_id,
                      ),
                  ),
                )
                .map((activityUser) => activityUser.id),
            );

            this.data.questsUserSignal.update((questsUser) =>
              questsUser.filter((questUser) => !staleQuestUserIds.has(questUser.id)),
            );
            this.data.activitiesUserSignal.update((activitiesUser) =>
              activitiesUser.filter((activityUser) => !staleActivityUserIds.has(activityUser.id)),
            );

            this.data.updateAllQuestStates();
            this.data.loadingSignal.set(false);
            createDailyQuest();
          }
        },
        error: (error) => {
          this.data.errorSignal.set(this.data.formatError(error, 'Failed to refresh daily quest'));
          this.data.loadingSignal.set(false);
        },
      });
    });
  }

  private buildDailyQuestDeletionRequests(staleQuestUsers: QuestUser[]): Observable<unknown>[] {
    const staleQuestIds = new Set(staleQuestUsers.map((questUser) => questUser.quest_id));
    const staleActivityIds = new Set(
      this.data
        .activities()
        .filter((activity) => staleQuestIds.has(activity.quest_id))
        .map((activity) => activity.id),
    );
    const activityUsersToDelete = this.data
      .activitiesUser()
      .filter(
        (activityUser) =>
          activityUser.user_id === this.data.currentUserId() &&
          staleActivityIds.has(activityUser.activity_id),
      );

    return [
      ...staleQuestUsers.map((questUser) => this.data.questsApi.deleteQuestUser(questUser.id)),
      ...activityUsersToDelete.map((activityUser) =>
        this.data.questsApi.deleteActivityUser(activityUser.id),
      ),
    ];
  }

  private createDailyQuestAssignment(quest: Quest): void {
    const questUser = new QuestUser({
      id: 0,
      user_id: this.data.currentUserId(),
      quest_id: quest.id,
      status: 'in_progress',
      progress: 0,
      start_date: this.data.getTodayDate(),
      end_date: null,
      collaborative_session_id: null,
    });
    const activitiesToStart = this.data
      .activities()
      .filter((activity) => activity.quest_id === quest.id);

    this.data.loadingSignal.set(true);
    this.data.errorSignal.set(null);

    this.data.questsApi
      .createQuestUser(questUser)
      .pipe(retry(2))
      .subscribe({
        next: (createdQuestUser) => {
          if (activitiesToStart.length === 0) {
            this.data.questsUserSignal.update((questsUser) => [...questsUser, createdQuestUser]);
            this.data.updateAllQuestStates();
            this.data.loadingSignal.set(false);
            return;
          }

          const createdActivitiesUser: ActivityUser[] = [];
          let completedRequests = 0;

          activitiesToStart.forEach((activity) => {
            const newActivityUser = new ActivityUser({
              id: 0,
              user_id: this.data.currentUserId(),
              activity_id: activity.id,
              progress: 0,
              end_date: null,
              collaborative_session_id: null,
            });

            this.data.questsApi
              .createActivityUser(newActivityUser)
              .pipe(retry(2))
              .subscribe({
                next: (createdAct) => {
                  createdActivitiesUser.push(createdAct);
                  completedRequests++;

                  if (completedRequests === activitiesToStart.length) {
                    this.data.questsUserSignal.update((questsUser) => [
                      ...questsUser,
                      createdQuestUser,
                    ]);
                    this.data.activitiesUserSignal.update((activitiesUser) => [
                      ...activitiesUser,
                      ...createdActivitiesUser,
                    ]);
                    this.data.updateAllQuestStates();
                    this.data.loadingSignal.set(false);
                  }
                },
                error: (error) => {
                  this.data.errorSignal.set(
                    this.data.formatError(error, 'Failed to assign daily quest activities'),
                  );
                  this.data.loadingSignal.set(false);
                },
              });
          });
        },
        error: (error) => {
          this.data.errorSignal.set(this.data.formatError(error, 'Failed to assign daily quest'));
          this.data.loadingSignal.set(false);
        },
      });
  }

  private pickDailyQuestForDate(date: string): Quest | undefined {
    const dailyQuests = this.data.quests().filter((quest) => quest.category === 'daily_quest');
    const scheduledQuest = dailyQuests.find((quest) => this.getQuestScheduleDate(quest) === date);
    if (scheduledQuest) {
      return scheduledQuest;
    }

    const pastQuests = dailyQuests.filter((quest) => {
      const scheduleDate = this.getQuestScheduleDate(quest);
      return scheduleDate !== null && scheduleDate < date;
    });
    const fallbackPool = pastQuests.length > 0 ? pastQuests : dailyQuests;
    return fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
  }

  private getQuestScheduleDate(quest: Quest): string | null {
    return quest.expiration_date?.slice(0, 10) ?? null;
  }
}
