import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { QuestUser } from '../domain/model/quest-user.entity';
import { CollaborativeQuestsService } from './collaborative-quests.service';
import { QuestsService } from './quests.service';

@Injectable({
  providedIn: 'root',
})
export class QuestProgressService {
  constructor(
    private readonly store: QuestsService,
    private readonly collaborativeQuests: CollaborativeQuestsService,
  ) {}

  addQuestProgress(questId: number): Observable<QuestUser | null> {
    const quest = this.store.quests().find((item) => item.id === questId);
    if (!quest) {
      this.store.errorSignal.set('Failed to start quest: Not found');
      return of(null);
    }

    const questUser = new QuestUser({
      id: 0,
      user_id: this.store.currentUserId(),
      quest_id: questId,
      status: 'IN_PROGRESS',
      progress: 0,
      start_date: this.store.getTodayDate(),
      end_date: null,
      collaborative_session_id: null,
    });

    this.store.loadingSignal.set(true);
    this.store.errorSignal.set(null);

    return this.store.questsApi.createQuestUser(questUser).pipe(
      tap({
        next: (createdQuestUser) => {
          this.store.questsUserSignal.update((questsUser) =>
            this.store.mergeById(questsUser, [createdQuestUser]),
          );
          this.store.updateAllQuestStates();
          this.store.loadActivityUsersByQuestUserId(createdQuestUser.id);
          this.store.loadingSignal.set(false);
        },
        error: (error) => {
          this.store.errorSignal.set(this.store.formatError(error, 'Failed to start quest'));
          this.store.loadingSignal.set(false);
        },
      }),
    );
  }

  addCollaborativeQuestProgress(questId: number): void {
    this.collaborativeQuests.addQuestProgress(questId);
  }

  updateQuestCompleted(questId: number): Observable<QuestUser | null> {
    const sessionId = this.store.getCurrentProgressSessionId(questId);
    if (sessionId !== null) {
      return this.collaborativeQuests.completeQuest(questId, sessionId);
    }

    const questUser = this.store.findCurrentUserActiveQuest(questId, sessionId);
    if (!questUser) {
      return of(null);
    }

    this.store.loadingSignal.set(true);
    this.store.errorSignal.set(null);
    return this.store.questsApi.completeQuestUser(questUser.id).pipe(
      tap({
        next: (completedQuestUser) => {
          this.store.questsUserSignal.update((questsUser) =>
            this.store.mergeById(questsUser, [completedQuestUser]),
          );
          this.store.refreshCurrentUserProfile();
          this.store.updateAllQuestStates();
          this.store.loadingSignal.set(false);
        },
        error: (error) => {
          this.store.errorSignal.set(this.store.formatError(error, 'Failed to complete quest'));
          this.store.loadingSignal.set(false);
        },
      }),
    );
  }

  deleteQuestProgress(questId: number): void {
    const sessionId = this.store.getCurrentProgressSessionId(questId);
    if (sessionId !== null) {
      const session = this.store
        .collaborativeSessions()
        .find((item) => item.id === sessionId);
      const currentMember = this.store
        .collaborativeMembers()
        .find(
          (member) =>
            member.session_id === sessionId &&
            member.user_id === this.store.currentUserId() &&
            member.status === 'ACCEPTED',
        );

      if (session?.status === 'PENDING' && session.owner_user_id === this.store.currentUserId()) {
        this.collaborativeQuests.deletePendingSession(sessionId);
        return;
      }

      if (session?.status === 'PENDING' && currentMember && currentMember.role !== 'OWNER') {
        this.collaborativeQuests.leaveQuest(currentMember.id);
        return;
      }
    }

    const questUser = this.store.findCurrentUserActiveQuest(questId, sessionId);
    if (!questUser) {
      return;
    }

    this.store.loadingSignal.set(true);
    this.store.errorSignal.set(null);

    this.store.questsApi.deleteQuestUser(questUser.id).subscribe({
      next: () => {
        this.store.questsUserSignal.update((questsUser) =>
          questsUser.filter((item) => item.id !== questUser.id),
        );
        this.store.activitiesUserSignal.update((activitiesUser) =>
          activitiesUser.filter((item) => item.quest_user_id !== questUser.id),
        );
        this.store.updateAllQuestStates();
        this.store.loadingSignal.set(false);
      },
      error: (err) => {
        this.store.errorSignal.set(this.store.formatError(err, 'Failed to delete active quest'));
        this.store.loadingSignal.set(false);
      },
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
      this.store.errorSignal.set('Failed to update activity: assignment not found');
      return;
    }

    this.store.loadingSignal.set(true);
    this.store.errorSignal.set(null);
    this.store.questsApi
      .submitActivityUser(activityUser.id, { data: { checked: progress >= 100 } })
      .subscribe({
        next: (updatedActivityUser) => {
          this.store.activitiesUserSignal.update((activitiesUser) =>
            this.store.mergeById(activitiesUser, [updatedActivityUser]),
          );
          this.store.refreshCurrentUserProfile();
          this.refreshActiveQuestUsers();
          this.store.loadingSignal.set(false);
        },
        error: (error) => {
          this.store.errorSignal.set(this.store.formatError(error, 'Failed to update activity'));
          this.store.loadingSignal.set(false);
        },
      });
  }

  private refreshActiveQuestUsers(): void {
    ['IN_PROGRESS', 'READY_TO_COMPLETE'].forEach((status) => {
      this.store.questsApi
        .getQuestUsersByUserAndStatus(this.store.currentUserId(), status)
        .subscribe({
          next: (questUsers) => {
            this.store.questsUserSignal.update((current) =>
              this.store.mergeById(current, questUsers),
            );
            this.store.updateAllQuestStates();
          },
        });
    });
  }
}
