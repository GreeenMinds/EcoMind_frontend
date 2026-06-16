import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { retry } from 'rxjs';
import { ActivityUser } from '../domain/model/activity-user.entity';
import { QuestUser } from '../domain/model/quest-user.entity';
import { Quest } from '../domain/model/quest.entity';
import { QuestRewardsService } from './quest-rewards.service';
import { CollaborativeQuestsService } from './collaborative-quests.service';
import { QuestsService } from './quests.service';

@Injectable({
  providedIn: 'root',
})
export class QuestProgressService {

  constructor(
    private readonly store: QuestsService,
    private readonly collaborativeQuests: CollaborativeQuestsService,
    private readonly questRewardsService: QuestRewardsService,
  ) {}

  addQuestProgress(questId: number): void {
    const quest = this.store.quests().find((item) => item.id === questId);
    if (quest?.type === 'collaborative') {
      this.collaborativeQuests.addQuestProgress(questId);
      return;
    }

    if (!quest) {
      this.store.errorSignal.set('Failed to start quest: Not found');
      return;
    }

    const questUser = new QuestUser({
      id: 0,
      user_id: this.store.currentUserId(),
      quest_id: questId,
      status: 'in_progress',
      progress: 0,
      start_date: this.store.getTodayDate(),
      end_date: null,
      collaborative_session_id: null,
    });

    this.store.loadingSignal.set(true);
    this.store.errorSignal.set(null);

    this.store.questsApi.createQuestUser(questUser).pipe(retry(2), takeUntilDestroyed())
      .subscribe({
        next: (createdQuestUser) => {
          const activitiesToStart = quest.type === 'activities'
              ? this.store.activities().filter((activity) => activity.quest_id === questId): [];

          if (activitiesToStart.length === 0) {
            this.store.questsUserSignal.update((questsUser) => [...questsUser, createdQuestUser]);
            this.store.loadingSignal.set(false);
            return;
          }

          const createdActivitiesUser: ActivityUser[] = [];
          let completedRequests = 0;

          activitiesToStart.forEach((activity) => {
            const newActivityUser = new ActivityUser({
              id: 0,
              user_id: this.store.currentUserId(),
              activity_id: activity.id,
              progress: 0,
              end_date: null,
              collaborative_session_id: null,
            });

            this.store.questsApi.createActivityUser(newActivityUser).pipe(retry(2), takeUntilDestroyed())
              .subscribe({
                next: (createdAct) => {
                  createdActivitiesUser.push(createdAct);
                  completedRequests++;

                  if (completedRequests === activitiesToStart.length) {
                    this.store.questsUserSignal.update((questsUser) => [...questsUser, createdQuestUser]);
                    this.store.activitiesUserSignal.update((activitiesUser) => [...activitiesUser, ...createdActivitiesUser,]);
                    this.store.loadingSignal.set(false);
                  }
                },
                error: (error) => {
                  this.store.errorSignal.set(
                    this.store.formatError(error, 'Failed to start quest activities'),
                  );
                  this.store.loadingSignal.set(false);
                },
              });
          });
        },
        error: (error) => {
          this.store.errorSignal.set(this.store.formatError(error, 'Failed to start quest'));
          this.store.loadingSignal.set(false);
        },
      });
  }

  addCollaborativeQuestProgress(questId: number): void {
    this.collaborativeQuests.addQuestProgress(questId);
  }

  updateQuestCompleted(questId: number): void {
    const sessionId = this.store.getCurrentProgressSessionId(questId);
    if (sessionId !== null) {
      this.collaborativeQuests.completeQuest(questId, sessionId);
      return;
    }

    const questUser = this.store.findCurrentUserActiveQuest(questId, sessionId);
    if (!questUser) {
      return;
    }

    const quest = this.store.quests().find((item) => item.id === questId);
    const rewardUserIds =
      quest && this.questRewardsService.shouldAwardQuestReward(quest, questUser.user_id)
        ? [questUser.user_id]
        : [];
    questUser.status = 'completed';
    questUser.progress = 100;
    questUser.end_date = this.store.getTodayDate();
    this.updateQuestUser(questUser, 'Failed to complete quest', quest, rewardUserIds);
  }

  deleteQuestProgress(questId: number): void {
    const sessionId = this.store.getCurrentProgressSessionId(questId);
    if (sessionId !== null) {
      const currentMember = this.store
        .collaborativeMembers()
        .find(
          (member) =>
            member.session_id === sessionId &&
            member.user_id === this.store.currentUserId() &&
            member.status === 'accepted',
        );
      if (currentMember) {
        this.collaborativeQuests.leaveQuest(currentMember.id);
        return;
      }
    }

    const questUser = this.store.findCurrentUserActiveQuest(questId, sessionId);
    if (!questUser) {
      return;
    }

    const activityIds = this.store
      .activities()
      .filter((activity) => activity.quest_id === questId)
      .map((activity) => activity.id);

    const activityUsersToDelete = this.store
      .activitiesUser()
      .filter(
        (activityUser) =>
          activityUser.user_id === this.store.currentUserId() &&
          activityUser.collaborative_session_id === sessionId &&
          activityIds.includes(activityUser.activity_id),
      );

    const minigameAttemptsToDelete = this.store
      .minigameAttempts()
      .filter(
        (attempt) =>
          attempt.user_id === this.store.currentUserId() &&
          attempt.quest_id === questId &&
          questUser.status !== 'completed',
      );

    this.store.loadingSignal.set(true);
    this.store.errorSignal.set(null);

    const totalDeletes = 1 + activityUsersToDelete.length + minigameAttemptsToDelete.length;
    let completedDeletes = 0;

    const checkDeletesCompleted = () => {
      completedDeletes++;
      if (completedDeletes === totalDeletes) {
        this.store.questsUserSignal.update((questsUser) =>
          questsUser.filter((item) => item.id !== questUser.id),
        );
        this.store.activitiesUserSignal.update((activitiesUser) =>
          activitiesUser.filter(
            (item) => !activityUsersToDelete.some((deleted) => deleted.id === item.id),
          ),
        );
        this.store.minigameAttemptsSignal.update((attempts) =>
          attempts.filter(
            (item) => !minigameAttemptsToDelete.some((deleted) => deleted.id === item.id),
          ),
        );
        this.store.loadingSignal.set(false);
      }
    };

    this.store.questsApi
      .deleteQuestUser(questUser.id)
      .pipe(retry(2), takeUntilDestroyed())
      .subscribe({
        next: () => checkDeletesCompleted(),
        error: (err) => {
          this.store.errorSignal.set(this.store.formatError(err, 'Failed to delete active quest'));
          this.store.loadingSignal.set(false);
        },
      });

    activityUsersToDelete.forEach((actUser) => {
      this.store.questsApi
        .deleteActivityUser(actUser.id)
        .pipe(retry(2), takeUntilDestroyed())
        .subscribe({
          next: () => checkDeletesCompleted(),
          error: (err) =>
            this.store.errorSignal.set(
              this.store.formatError(err, 'Failed to delete activity history'),
            ),
        });
    });

    minigameAttemptsToDelete.forEach((attempt) => {
      this.store.questsApi
        .deleteMinigameAttempt(attempt.id)
        .pipe(retry(2), takeUntilDestroyed())
        .subscribe({
          next: () => checkDeletesCompleted(),
          error: (err) =>
            this.store.errorSignal.set(
              this.store.formatError(err, 'Failed to delete minigame attempts'),
            ),
        });
    });
  }

  updateActivityProgress(activityId: number, progress: number): void {
    const sessionId = this.store.getCurrentActivitySessionId(activityId);
    if (sessionId !== null) {
      this.collaborativeQuests.updateActivityProgress(activityId, sessionId, progress);
      return;
    }

    const activityUser = this.store.findCurrentUserActivity(activityId, sessionId);
    if (!activityUser) {
      this.addActivityProgress(activityId, progress);
      return;
    }

    activityUser.progress = progress;
    activityUser.end_date = progress >= 100 ? this.store.getTodayDate() : null;
    this.updateActivityUser(activityUser, 'Failed to update activity', true);
  }

  private addActivityProgress(activityId: number, progress: number): void {
    const activityUser = new ActivityUser({
      id: 0,
      user_id: this.store.currentUserId(),
      activity_id: activityId,
      progress,
      end_date: progress >= 100 ? this.store.getTodayDate() : null,
      collaborative_session_id: this.store.getCurrentActivitySessionId(activityId),
    });

    this.store.loadingSignal.set(true);
    this.store.errorSignal.set(null);
    this.store.questsApi
      .createActivityUser(activityUser)
      .pipe(retry(2), takeUntilDestroyed())
      .subscribe({
        next: (createdActivityUser) => {
          this.store.activitiesUserSignal.update((activitiesUser) => [
            ...activitiesUser,
            createdActivityUser,
          ]);
          this.syncQuestProgressFromActivity(activityId);
          this.store.loadingSignal.set(false);
        },
        error: (error) => {
          this.store.errorSignal.set(this.store.formatError(error, 'Failed to update activity'));
          this.store.loadingSignal.set(false);
        },
      });
  }

  private updateActivityUser(activityUser: ActivityUser, fallbackMessage: string, syncQuestProgress = false): void {
    this.store.loadingSignal.set(true);
    this.store.errorSignal.set(null);
    this.store.questsApi
      .updateActivityUser(activityUser)
      .pipe(retry(2), takeUntilDestroyed())
      .subscribe({
        next: (updatedActivityUser) => {
          this.store.activitiesUserSignal.update((activitiesUser) =>
            activitiesUser.map((item) =>
              item.id === updatedActivityUser.id ? updatedActivityUser : item,
            ),
          );
          if (syncQuestProgress) {
            this.syncQuestProgressFromActivity(updatedActivityUser.activity_id);
          }
          this.store.loadingSignal.set(false);
        },
        error: (error) => {
          this.store.errorSignal.set(this.store.formatError(error, fallbackMessage));
          this.store.loadingSignal.set(false);
        },
      });
  }

  private updateQuestUser(questUser: QuestUser, fallbackMessage: string, rewardQuest?: Quest, rewardUserIds: number[] = []): void {
    this.store.loadingSignal.set(true);
    this.store.errorSignal.set(null);
    this.store.questsApi
      .updateQuestUser(questUser)
      .pipe(retry(2), takeUntilDestroyed())
      .subscribe({
        next: (updatedQuestUser) => {
          this.store.questsUserSignal.update((questsUser) =>
            questsUser.map((item) => (item.id === updatedQuestUser.id ? updatedQuestUser : item)),
          );
          if (!rewardQuest || rewardUserIds.length === 0) {
            this.store.loadingSignal.set(false);
            return;
          }

          this.questRewardsService.giveQuestRewards(
            rewardQuest,
            rewardUserIds,
            'Failed to award quest rewards',
            (users) => {
              this.questRewardsService.mergeRewardedUsers(users);
              this.store.loadingSignal.set(false);
            },
          );
        },
        error: (error) => {
          this.store.errorSignal.set(this.store.formatError(error, fallbackMessage));
          this.store.loadingSignal.set(false);
        },
      });
  }

  private syncQuestProgressFromActivity(activityId: number): void {
    const activity = this.store.activities().find((item) => item.id === activityId);
    if (!activity) {
      return;
    }

    const sessionId = this.store.getCurrentActivitySessionId(activityId);
    const questUser = this.store.findCurrentUserActiveQuest(activity.quest_id, sessionId);
    if (!questUser || questUser.status === 'completed') {
      return;
    }

    const activities = this.store
      .activities()
      .filter((item) => item.quest_id === activity.quest_id);
    const completedActivitiesCount = activities.filter((item) => {
      const activityUser = this.store.findCurrentUserActivity(item.id, sessionId);
      return (activityUser?.progress ?? 0) >= 100;
    }).length;

    questUser.progress = this.store.calculateActivityProgress(activities, completedActivitiesCount);
    questUser.status = questUser.progress >= 100 ? 'ready_to_complete' : 'in_progress';
    questUser.end_date = null;
    this.updateQuestUser(questUser, 'Failed to update quest progress');
  }
}
