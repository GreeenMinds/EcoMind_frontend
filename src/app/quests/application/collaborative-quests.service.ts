import { Injectable } from '@angular/core';
import { retry } from 'rxjs';
import { User } from '../../profile/domain/model/user.entity';
import { Activity } from '../domain/model/activity.entity';
import { ActivityUser } from '../domain/model/activity-user.entity';
import { CollaborativeQuestMember } from '../domain/model/collaborative-quest-member.entity';
import { CollaborativeQuestSession } from '../domain/model/collaborative-quest-session.entity';
import { QuestUser } from '../domain/model/quest-user.entity';
import { Quest } from '../domain/model/quest.entity';
import { QuestRewardsService } from './quest-rewards.service';
import { QuestsService } from './quests.service';

@Injectable({
  providedIn: 'root',
})
export class CollaborativeQuestsService {
  constructor(
    private readonly store: QuestsService,
    private readonly questRewardsService: QuestRewardsService,
  ) {}

  private get questsApi() {
    return this.store.questsApi;
  }

  private formatError(error: unknown, fallback: string): string {
    return this.store.formatError(error, fallback);
  }
  private calculateActivityProgress(
    activities: Activity[],
    completedActivitiesCount: number,
  ): number {
    return this.store.calculateActivityProgress(activities, completedActivitiesCount);
  }
  private getCollaborativeActivityProgress(activityId: number, sessionId: number): number {
    return this.store.getCollaborativeActivityProgress(activityId, sessionId);
  }
  private mergeById<T extends { id: number }>(existing: T[], updates: T[]): T[] {
    return this.store.mergeById(existing, updates);
  }
  private shouldAwardQuestReward(quest: Quest, userId: number): boolean {
    return this.questRewardsService.shouldAwardQuestReward(quest, userId);
  }
  private giveQuestRewards(
    quest: Quest,
    userIds: number[],
    fallbackMessage: string,
    onSuccess: (users: User[]) => void,
  ): void {
    this.questRewardsService.giveQuestRewards(quest, userIds, fallbackMessage, onSuccess);
  }
  private mergeRewardedUsers(users: User[]): void {
    this.questRewardsService.mergeRewardedUsers(users);
  }

  addInvitation(questId: number, friendUserId: number): void {
    const quest = this.store.quests().find((item) => item.id === questId);

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
      owner_user_id: this.store.currentUserId(),
      status: 'pending',
      created_at: this.store.getTodayDate(),
      started_at: null,
      completed_at: null,
    });

    this.store.loadingSignal.set(true);
    this.store.errorSignal.set(null);

    this.store.questsApi
      .createCollaborativeQuestSession(session)
      .pipe(retry(2))
      .subscribe({
        next: (createdSession) => {
          this.store.questsApi
            .createCollaborativeQuestMember(this.createOwnerMember(createdSession.id))
            .pipe(retry(2))
            .subscribe({
              next: (ownerMember) => {
                this.store.questsApi
                  .createCollaborativeQuestMember(
                    this.createInvitedMember(createdSession.id, friendUserId),
                  )
                  .pipe(retry(2))
                  .subscribe({
                    next: (invitedMember) => {
                      this.store.collaborativeSessionsSignal.update((sessions) => [
                        ...sessions,
                        createdSession,
                      ]);
                      this.store.collaborativeMembersSignal.update((members) => [
                        ...members,
                        ownerMember,
                        invitedMember,
                      ]);
                      this.store.loadingSignal.set(false);
                    },
                    error: (error) => {
                      this.store.errorSignal.set(
                        this.store.formatError(error, 'Failed to invite friend'),
                      );
                      this.store.loadingSignal.set(false);
                    },
                  });
              },
              error: (error) => {
                this.store.errorSignal.set(
                  this.store.formatError(error, 'Failed to initialize session owner'),
                );
                this.store.loadingSignal.set(false);
              },
            });
        },
        error: (error) => {
          this.store.errorSignal.set(
            this.store.formatError(error, 'Failed to create collaborative session'),
          );
          this.store.loadingSignal.set(false);
        },
      });
  }

  private createCollaborativeInvitation(
    session: CollaborativeQuestSession,
    friendUserId: number,
  ): void {
    if (
      session.status !== 'pending' ||
      this.store
        .collaborativeMembers()
        .filter(
          (member) =>
            member.session_id === session.id &&
            member.role !== 'owner' &&
            ['accepted', 'pending'].includes(member.status),
        ).length >= 5
    ) {
      return;
    }

    this.store.loadingSignal.set(true);
    this.store.errorSignal.set(null);

    this.store.questsApi
      .createCollaborativeQuestMember(this.createInvitedMember(session.id, friendUserId))
      .pipe(retry(2))
      .subscribe({
        next: (createdMember) => {
          this.store.collaborativeMembersSignal.update((members) => [...members, createdMember]);
          this.store.loadingSignal.set(false);
        },
        error: (error) => {
          this.store.errorSignal.set(this.store.formatError(error, 'Failed to invite friend'));
          this.store.loadingSignal.set(false);
        },
      });
  }

  private createOwnerMember(sessionId: number): CollaborativeQuestMember {
    return new CollaborativeQuestMember({
      id: 0,
      session_id: sessionId,
      user_id: this.store.currentUserId(),
      invited_by_user_id: null,
      role: 'owner',
      status: 'accepted',
      invited_at: null,
      responded_at: this.store.getTodayDate(),
      left_at: null,
      removed_at: null,
    });
  }

  private createInvitedMember(sessionId: number, userId: number): CollaborativeQuestMember {
    return new CollaborativeQuestMember({
      id: 0,
      session_id: sessionId,
      user_id: userId,
      invited_by_user_id: this.store.currentUserId(),
      role: 'participant',
      status: 'pending',
      invited_at: this.store.getTodayDate(),
      responded_at: null,
      left_at: null,
      removed_at: null,
    });
  }

  acceptInvitation(memberId: number): void {
    const member = this.store.collaborativeMembers().find((item) => item.id === memberId);
    const session = member
      ? this.store.collaborativeSessions().find((item) => item.id === member.session_id)
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
    member.responded_at = this.store.getTodayDate();
    this.updateCollaborativeMember(member, 'Failed to accept invitation');
  }

  declineInvitation(memberId: number): void {
    const member = this.store.collaborativeMembers().find((item) => item.id === memberId);
    if (!member || member.status !== 'pending') {
      return;
    }

    member.status = 'declined';
    member.responded_at = this.store.getTodayDate();
    this.updateCollaborativeMember(member, 'Failed to decline invitation');
  }

  leaveQuest(memberId: number): void {
    const member = this.store.collaborativeMembers().find((item) => item.id === memberId);
    if (!member || member.status !== 'accepted') {
      return;
    }

    member.status = 'left';
    member.left_at = this.store.getTodayDate();
    this.store.loadingSignal.set(true);
    this.store.errorSignal.set(null);

    const progressToDelete = [
      ...this.store
        .questsUser()
        .filter(
          (item) =>
            item.user_id === member.user_id &&
            item.collaborative_session_id === member.session_id &&
            item.status !== 'completed',
        ),
      ...this.store
        .activitiesUser()
        .filter(
          (item) =>
            item.user_id === member.user_id && item.collaborative_session_id === member.session_id,
        ),
    ];

    const deleteRequests = progressToDelete.map((progress) =>
      progress instanceof QuestUser
        ? this.store.questsApi.deleteQuestUser(progress.id)
        : this.store.questsApi.deleteActivityUser(progress.id),
    );

    this.store.questsApi
      .updateCollaborativeQuestMember(member)
      .pipe(retry(2))
      .subscribe({
        next: (updatedMember) => {
          if (deleteRequests.length === 0) {
            this.replaceCollaborativeMember(updatedMember as CollaborativeQuestMember);
            this.store.loadingSignal.set(false);
            return;
          }

          let completedDeletes = 0;
          deleteRequests.forEach((request) => {
            request.pipe(retry(2)).subscribe({
              next: () => {
                completedDeletes++;

                if (completedDeletes === deleteRequests.length) {
                  this.replaceCollaborativeMember(updatedMember as CollaborativeQuestMember);
                  this.store.questsUserSignal.update((questsUser) =>
                    questsUser.filter(
                      (item) =>
                        !(
                          item.user_id === member.user_id &&
                          item.collaborative_session_id === member.session_id &&
                          item.status !== 'completed'
                        ),
                    ),
                  );
                  this.store.activitiesUserSignal.update((activitiesUser) =>
                    activitiesUser.filter(
                      (item) =>
                        !(
                          item.user_id === member.user_id &&
                          item.collaborative_session_id === member.session_id
                        ),
                    ),
                  );
                  this.store.loadingSignal.set(false);
                }
              },
              error: (err) =>
                this.store.errorSignal.set(this.store.formatError(err, 'Failed to clear history')),
            });
          });
        },
        error: (error) => {
          this.store.errorSignal.set(
            this.store.formatError(error, 'Failed to leave collaborative quest'),
          );
          this.store.loadingSignal.set(false);
        },
      });
  }

  removeMember(memberId: number): void {
    const member = this.store.collaborativeMembers().find((item) => item.id === memberId);
    const session = member
      ? this.store.collaborativeSessions().find((item) => item.id === member.session_id)
      : undefined;
    if (
      !member ||
      !session ||
      session.owner_user_id !== this.store.currentUserId() ||
      session.status === 'started' ||
      member.role === 'owner'
    ) {
      return;
    }

    member.status = 'removed';
    member.removed_at = this.store.getTodayDate();
    this.updateCollaborativeMember(member, 'Failed to remove participant');
  }

  private updateCollaborativeMember(
    member: CollaborativeQuestMember,
    fallbackMessage: string,
  ): void {
    this.store.loadingSignal.set(true);
    this.store.errorSignal.set(null);
    this.store.questsApi
      .updateCollaborativeQuestMember(member)
      .pipe(retry(2))
      .subscribe({
        next: (updatedMember) => {
          this.replaceCollaborativeMember(updatedMember);
          this.store.loadingSignal.set(false);
        },
        error: (error) => {
          this.store.errorSignal.set(this.store.formatError(error, fallbackMessage));
          this.store.loadingSignal.set(false);
        },
      });
  }

  private replaceCollaborativeMember(member: CollaborativeQuestMember): void {
    this.store.collaborativeMembersSignal.update((members) =>
      members.map((item) => (item.id === member.id ? member : item)),
    );
  }

  addQuestProgress(questId: number): void {
    const quest = this.store.quests().find((item) => item.id === questId);
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
      owner_user_id: this.store.currentUserId(),
      status: 'pending',
      created_at: this.store.getTodayDate(),
      started_at: null,
      completed_at: null,
    });

    this.store.loadingSignal.set(true);
    this.store.errorSignal.set(null);

    this.store.questsApi
      .createCollaborativeQuestSession(newSession)
      .pipe(retry(2))
      .subscribe({
        next: (createdSession) => {
          this.store.questsApi
            .createCollaborativeQuestMember(this.createOwnerMember(createdSession.id))
            .pipe(retry(2))
            .subscribe({
              next: (ownerMember) => {
                this.store.collaborativeSessionsSignal.update((sessions) => [
                  ...sessions,
                  createdSession,
                ]);
                this.store.collaborativeMembersSignal.update((members) => [
                  ...members,
                  ownerMember,
                ]);
                this.startExistingCollaborativeSession(createdSession);
              },
              error: (err) =>
                this.store.errorSignal.set(
                  this.store.formatError(err, 'Failed to register group owner'),
                ),
            });
        },
        error: (error) => {
          this.store.errorSignal.set(
            this.store.formatError(error, 'Failed to start collaborative quest'),
          );
          this.store.loadingSignal.set(false);
        },
      });
  }

  completeQuest(questId: number, sessionId: number): void {
    const session = this.store.collaborativeSessions().find((item) => item.id === sessionId);
    const quest = this.store.quests().find((item) => item.id === questId);
    if (!session || !quest) {
      return;
    }

    const acceptedUserIds = this.store
      .collaborativeMembers()
      .filter((member) => member.session_id === sessionId && member.status === 'accepted')
      .map((member) => member.user_id);

    const rewardUserIds = acceptedUserIds.filter((userId) =>
      this.questRewardsService.shouldAwardQuestReward(quest, userId),
    );

    const questUsers = this.store
      .questsUser()
      .filter(
        (questUser) =>
          questUser.quest_id === questId &&
          questUser.collaborative_session_id === sessionId &&
          acceptedUserIds.includes(questUser.user_id) &&
          questUser.status !== 'completed',
      );

    questUsers.forEach((questUser) => {
      questUser.status = 'completed';
      questUser.progress = 100;
      questUser.end_date = this.store.getTodayDate();
    });
    session.status = 'completed';
    session.completed_at = this.store.getTodayDate();

    this.store.loadingSignal.set(true);
    this.store.errorSignal.set(null);

    this.store.questsApi
      .updateCollaborativeQuestSession(session)
      .pipe(retry(2))
      .subscribe({
        next: (updatedSession) => {
          if (questUsers.length === 0) {
            this.store.collaborativeSessionsSignal.update((sessions) =>
              sessions.map((item) => (item.id === updatedSession.id ? updatedSession : item)),
            );
            this.store.loadingSignal.set(false);
            return;
          }

          const updatedQuestUsersList: QuestUser[] = [];
          let completedQuestUsersCount = 0;

          questUsers.forEach((qUser) => {
            this.store.questsApi
              .updateQuestUser(qUser)
              .pipe(retry(2))
              .subscribe({
                next: (updatedQUser) => {
                  updatedQuestUsersList.push(updatedQUser);
                  completedQuestUsersCount++;

                  if (completedQuestUsersCount === questUsers.length) {
                    this.questRewardsService.giveQuestRewards(
                      quest,
                      rewardUserIds,
                      'Failed to complete collaborative quest',
                      (rewardedUsers) => {
                        this.store.collaborativeSessionsSignal.update((sessions) =>
                          sessions.map((item) =>
                            item.id === updatedSession.id ? updatedSession : item,
                          ),
                        );
                        this.store.questsUserSignal.update((existing) =>
                          this.store.mergeById(existing, updatedQuestUsersList),
                        );
                        this.questRewardsService.mergeRewardedUsers(rewardedUsers);
                        this.store.loadingSignal.set(false);
                      },
                    );
                  }
                },
                error: (err) =>
                  this.store.errorSignal.set(
                    this.store.formatError(err, 'Failed to update member progress'),
                  ),
              });
          });
        },
        error: (error) => {
          this.store.errorSignal.set(
            this.store.formatError(error, 'Failed to complete collaborative quest'),
          );
          this.store.loadingSignal.set(false);
        },
      });
  }

  updateActivityProgress(activityId: number, sessionId: number, progress: number): void {
    const activity = this.store.activities().find((item) => item.id === activityId);
    const session = this.store.collaborativeSessions().find((item) => item.id === sessionId);
    if (!activity || !session || session.status !== 'started') {
      return;
    }

    const acceptedMembers = this.store
      .collaborativeMembers()
      .filter((member) => member.session_id === sessionId && member.status === 'accepted');

    const activityRequests = acceptedMembers.map((member) => {
      const existingActivityUser = this.store
        .activitiesUser()
        .find(
          (item) =>
            item.user_id === member.user_id &&
            item.activity_id === activityId &&
            item.collaborative_session_id === sessionId,
        );
      if (existingActivityUser) {
        existingActivityUser.progress = progress;
        existingActivityUser.end_date = progress >= 100 ? this.store.getTodayDate() : null;
        return this.store.questsApi.updateActivityUser(existingActivityUser);
      }

      return this.store.questsApi.createActivityUser(
        new ActivityUser({
          id: 0,
          user_id: member.user_id,
          activity_id: activityId,
          progress,
          end_date: progress >= 100 ? this.store.getTodayDate() : null,
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
        this.store
          .questsUser()
          .find(
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
        return this.store.questsApi.updateQuestUser(questUser);
      });

    this.store.loadingSignal.set(true);
    this.store.errorSignal.set(null);

    const updatedActivitiesList: ActivityUser[] = [];
    let completedActivities = 0;

    activityRequests.forEach((request) => {
      request.pipe(retry(2)).subscribe({
        next: (actUser) => {
          updatedActivitiesList.push(actUser);
          completedActivities++;

          if (completedActivities === activityRequests.length) {
            if (questRequests.length === 0) {
              this.store.activitiesUserSignal.update((existing) =>
                this.store.mergeById(existing, updatedActivitiesList),
              );
              this.store.loadingSignal.set(false);
              return;
            }

            const updatedQuestUsersList: QuestUser[] = [];
            let completedQuests = 0;

            questRequests.forEach((qRequest) => {
              qRequest.pipe(retry(2)).subscribe({
                next: (qUser) => {
                  updatedQuestUsersList.push(qUser);
                  completedQuests++;

                  if (completedQuests === questRequests.length) {
                    this.store.activitiesUserSignal.update((existing) =>
                      this.store.mergeById(existing, updatedActivitiesList),
                    );
                    this.store.questsUserSignal.update((existing) =>
                      this.store.mergeById(existing, updatedQuestUsersList),
                    );
                    this.store.loadingSignal.set(false);
                  }
                },
                error: (err) =>
                  this.store.errorSignal.set(
                    this.store.formatError(err, 'Failed to update user quest status'),
                  ),
              });
            });
          }
        },
        error: (err) =>
          this.store.errorSignal.set(
            this.store.formatError(err, 'Failed to update user activity progress'),
          ),
      });
    });
  }

  private calculateCollaborativeQuestProgress(
    questId: number,
    sessionId: number,
    changedActivityId: number,
    changedProgress: number,
  ): number {
    const activities = this.store.activities().filter((item) => item.quest_id === questId);
    const completedActivitiesCount = activities.filter((activity) => {
      if (activity.id === changedActivityId) {
        return changedProgress >= 100;
      }

      return this.store.getCollaborativeActivityProgress(activity.id, sessionId) >= 100;
    }).length;
    return this.store.calculateActivityProgress(activities, completedActivitiesCount);
  }

  private startExistingCollaborativeSession(session: CollaborativeQuestSession): void {
    const acceptedMembers = this.store
      .collaborativeMembers()
      .filter((member) => member.session_id === session.id && member.status === 'accepted');
    const pendingMembers = this.store
      .collaborativeMembers()
      .filter((member) => member.session_id === session.id && member.status === 'pending');
    const activities = this.store
      .activities()
      .filter((activity) => activity.quest_id === session.quest_id);

    session.status = 'started';
    session.started_at = this.store.getTodayDate();

    const questUserRequests = acceptedMembers.map((member) =>
      this.store.questsApi.createQuestUser(
        new QuestUser({
          id: 0,
          user_id: member.user_id,
          quest_id: session.quest_id,
          status: 'in_progress',
          progress: 0,
          start_date: this.store.getTodayDate(),
          end_date: null,
          collaborative_session_id: session.id,
        }),
      ),
    );

    const activityUserRequests = acceptedMembers.flatMap((member) =>
      activities.map((activity) =>
        this.store.questsApi.createActivityUser(
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
      member.responded_at = this.store.getTodayDate();
      return this.store.questsApi.updateCollaborativeQuestMember(member);
    });

    this.store.loadingSignal.set(true);
    this.store.errorSignal.set(null);

    const totalRequests = 1 + pendingUpdates.length + questUserRequests.length + activityUserRequests.length;
    let completedRequests = 0;

    const updatedMembersList: CollaborativeQuestMember[] = [];
    const createdQuestUsersList: QuestUser[] = [];
    const createdActivityUsersList: ActivityUser[] = [];

    const checkAllSessionRequestsCompleted = () => {
      completedRequests++;
      if (completedRequests === totalRequests) {
        this.store.collaborativeSessionsSignal.update((sessions) =>
          sessions.map((item) => (item.id === session.id ? session : item)),
        );
        updatedMembersList.forEach((member) => this.replaceCollaborativeMember(member));
        this.store.questsUserSignal.update((questsUser) => [
          ...questsUser,
          ...createdQuestUsersList,
        ]);
        this.store.activitiesUserSignal.update((activitiesUser) => [
          ...activitiesUser,
          ...createdActivityUsersList,
        ]);

        this.store.updateAllQuestStates();
        this.store.loadingSignal.set(false);
      }
    };

    this.store.questsApi
      .updateCollaborativeQuestSession(session)
      .pipe(retry(2))
      .subscribe({
        next: () => checkAllSessionRequestsCompleted(),
        error: (err) =>
          this.store.errorSignal.set(this.store.formatError(err, 'Failed to update session')),
      });

    pendingUpdates.forEach((request) => {
      request.pipe(retry(2)).subscribe({
        next: (updatedMember) => {
          updatedMembersList.push(updatedMember);
          checkAllSessionRequestsCompleted();
        },
        error: (err) =>
          this.store.errorSignal.set(
            this.store.formatError(err, 'Failed to update pending members'),
          ),
      });
    });

    questUserRequests.forEach((request) => {
      request.pipe(retry(2)).subscribe({
        next: (createdQuestUser) => {
          createdQuestUsersList.push(createdQuestUser);
          checkAllSessionRequestsCompleted();
        },
        error: (err) =>
          this.store.errorSignal.set(
            this.store.formatError(err, 'Failed to map participants progress'),
          ),
      });
    });

    activityUserRequests.forEach((request) => {
      request.pipe(retry(2)).subscribe({
        next: (createdActUser) => {
          createdActivityUsersList.push(createdActUser);
          checkAllSessionRequestsCompleted();
        },
        error: (err) =>
          this.store.errorSignal.set(
            this.store.formatError(err, 'Failed to instantiate user activities'),
          ),
      });
    });
  }

  private findSessionForMember(
    member?: CollaborativeQuestMember,
  ): CollaborativeQuestSession | undefined {
    return member
      ? this.store.collaborativeSessions().find((session) => session.id === member.session_id)
      : undefined;
  }

  private findCurrentUserOwnedOpenSession(questId: number): CollaborativeQuestSession | undefined {
    return this.store.collaborativeSessions()
      .filter(
        (session) =>
          session.quest_id === questId &&
          session.owner_user_id === this.store.currentUserId() &&
          session.status === 'pending',
      )
      .sort((a, b) => b.id - a.id)[0];
  }

  private isUserBusyInQuest(userId: number, questId: number): boolean {
    const hasIndividualActiveQuest = this.store.questsUser().some(
      (questUser) =>
        questUser.user_id === userId &&
        questUser.quest_id === questId &&
        questUser.collaborative_session_id === null &&
        questUser.status !== 'completed',
    );
    if (hasIndividualActiveQuest) {
      return true;
    }

    return this.store.collaborativeMembers().some((member) => {
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

      return this.store.questsUser().some(
        (questUser) =>
          questUser.user_id === userId &&
          questUser.quest_id === questId &&
          questUser.collaborative_session_id === session.id &&
          questUser.status !== 'completed'
      );
    });
  }
}
