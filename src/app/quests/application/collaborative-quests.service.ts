import { Injectable } from '@angular/core';
import { ActivityUser } from '../domain/model/activity-user.entity';
import { CollaborativeQuestMember } from '../domain/model/collaborative-quest-member.entity';
import { CollaborativeQuestSession } from '../domain/model/collaborative-quest-session.entity';
import { QuestUser } from '../domain/model/quest-user.entity';
import { QuestRewardsService } from './quest-rewards.service';
import { QuestsService } from './quests.service';

@Injectable({
  providedIn: 'root',
})
export class CollaborativeQuestsService {
  private mockId = -1;

  constructor(
    private readonly store: QuestsService,
    private readonly questRewardsService: QuestRewardsService,
  ) {}

  addInvitation(questId: number, friendUserId: number): void {
    const quest = this.store.quests().find((item) => item.id === questId);
    if (!quest || quest.type !== 'collaborative') {
      return;
    }

    let session = this.findCurrentUserOwnedOpenSession(questId);
    if (!session) {
      session = this.createSession(questId);
      const ownerMember = this.createOwnerMember(session.id);

      this.store.collaborativeSessionsSignal.update((sessions) => [...sessions, session!]);
      this.store.collaborativeMembersSignal.update((members) => [...members, ownerMember]);
    }

    const alreadyInvited = this.store.collaborativeMembers().some(
      (member) =>
        member.session_id === session!.id &&
        member.user_id === friendUserId &&
        ['accepted', 'pending'].includes(member.status),
    );
    if (alreadyInvited) {
      return;
    }

    const invitedMember = this.createInvitedMember(session.id, friendUserId);
    this.store.collaborativeMembersSignal.update((members) => [...members, invitedMember]);
  }

  acceptInvitation(memberId: number): void {
    const member = this.store.collaborativeMembers().find((item) => item.id === memberId);
    const session = this.findSessionForMember(member);
    if (!member || !session || member.status !== 'pending' || session.status !== 'pending') {
      return;
    }

    member.status = 'accepted';
    member.responded_at = this.store.getTodayDate();
    this.replaceCollaborativeMember(member);
  }

  declineInvitation(memberId: number): void {
    const member = this.store.collaborativeMembers().find((item) => item.id === memberId);
    if (!member || member.status !== 'pending') {
      return;
    }

    member.status = 'declined';
    member.responded_at = this.store.getTodayDate();
    this.replaceCollaborativeMember(member);
  }

  leaveQuest(memberId: number): void {
    const member = this.store.collaborativeMembers().find((item) => item.id === memberId);
    const session = this.findSessionForMember(member);
    if (
      !member ||
      !session ||
      member.role === 'owner' ||
      member.status !== 'accepted' ||
      session.status !== 'pending'
    ) {
      return;
    }

    member.status = 'left';
    member.left_at = this.store.getTodayDate();
    this.replaceCollaborativeMember(member);
  }

  removeMember(memberId: number): void {
    const member = this.store.collaborativeMembers().find((item) => item.id === memberId);
    const session = this.findSessionForMember(member);
    if (
      !member ||
      !session ||
      session.owner_user_id !== this.store.currentUserId() ||
      session.status !== 'pending' ||
      member.role === 'owner'
    ) {
      return;
    }

    member.status = 'removed';
    member.removed_at = this.store.getTodayDate();
    this.replaceCollaborativeMember(member);
  }

  addQuestProgress(questId: number): void {
    const session = this.findCurrentUserOwnedOpenSession(questId);
    if (!session || !this.canStartSession(session)) {
      return;
    }

    session.status = 'started';
    session.started_at = this.store.getTodayDate();
    this.replaceSession(session);

    const questUser = this.createCurrentUserQuestProgress(questId, session.id);
    this.store.questsUserSignal.update((questsUser) => [...questsUser, questUser]);

    const activities = this.store.activities().filter((activity) => activity.quest_id === questId);
    const newActivitiesUser: ActivityUser[] = [];
    activities.forEach((activity) => {
      newActivitiesUser.push(
        new ActivityUser({
          id: this.getNextMockId(),
          user_id: this.store.currentUserId(),
          activity_id: activity.id,
          progress: 0,
          end_date: null,
          collaborative_session_id: session.id,
        }),
      );
    });

    this.store.activitiesUserSignal.update((activitiesUser) => [
      ...activitiesUser,
      ...newActivitiesUser,
    ]);
    this.store.updateAllQuestStates();
  }

  completeQuest(questId: number, sessionId: number): void {
    const session = this.store.collaborativeSessions().find((item) => item.id === sessionId);
    const quest = this.store.quests().find((item) => item.id === questId);
    const questUser = this.store.findCurrentUserActiveQuest(questId, sessionId);
    if (!session || !quest || !questUser) {
      return;
    }

    const shouldGiveReward = this.questRewardsService.shouldAwardQuestReward(
      quest,
      this.store.currentUserId(),
    );

    session.status = 'completed';
    session.completed_at = this.store.getTodayDate();
    questUser.status = 'completed';
    questUser.progress = 100;
    questUser.end_date = this.store.getTodayDate();

    this.replaceSession(session);
    this.replaceQuestUser(questUser);
    this.store.updateAllQuestStates();

    if (!shouldGiveReward) {
      return;
    }

    this.store.loadingSignal.set(true);
    this.store.errorSignal.set(null);
    this.questRewardsService.giveQuestRewards(
      quest,
      [this.store.currentUserId()],
      'Failed to complete collaborative quest',
      (users) => {
        this.questRewardsService.mergeRewardedUsers(users);
        this.store.loadingSignal.set(false);
      },
    );
  }

  updateActivityProgress(activityId: number, sessionId: number, progress: number): void {
    const activity = this.store.activities().find((item) => item.id === activityId);
    if (!activity) {
      return;
    }

    let activityUser = this.store.findCurrentUserActivity(activityId, sessionId);
    if (!activityUser) {
      activityUser = new ActivityUser({
        id: this.getNextMockId(),
        user_id: this.store.currentUserId(),
        activity_id: activityId,
        progress,
        end_date: progress >= 100 ? this.store.getTodayDate() : null,
        collaborative_session_id: sessionId,
      });
      this.store.activitiesUserSignal.update((items) => [...items, activityUser!]);
    } else {
      activityUser.progress = progress;
      activityUser.end_date = progress >= 100 ? this.store.getTodayDate() : null;
      this.store.activitiesUserSignal.update((items) =>
        items.map((item) => (item.id === activityUser!.id ? activityUser! : item)),
      );
    }

    this.updateQuestProgress(activity.quest_id, sessionId);
  }

  private createSession(questId: number): CollaborativeQuestSession {
    return new CollaborativeQuestSession({
      id: this.getNextMockId(),
      quest_id: questId,
      owner_user_id: this.store.currentUserId(),
      status: 'pending',
      created_at: this.store.getTodayDate(),
      started_at: null,
      completed_at: null,
    });
  }

  private createOwnerMember(sessionId: number): CollaborativeQuestMember {
    return new CollaborativeQuestMember({
      id: this.getNextMockId(),
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
      id: this.getNextMockId(),
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

  private createCurrentUserQuestProgress(questId: number, sessionId: number): QuestUser {
    return new QuestUser({
      id: this.getNextMockId(),
      user_id: this.store.currentUserId(),
      quest_id: questId,
      status: 'in_progress',
      progress: 0,
      start_date: this.store.getTodayDate(),
      end_date: null,
      collaborative_session_id: sessionId,
    });
  }

  private updateQuestProgress(questId: number, sessionId: number): void {
    const activities = this.store.activities().filter((item) => item.quest_id === questId);
    const completedActivities = activities.filter(
      (activity) => this.store.getCollaborativeActivityProgress(activity.id, sessionId) >= 100,
    ).length;
    const progress = this.store.calculateActivityProgress(activities, completedActivities);
    const questUser = this.store.findCurrentUserActiveQuest(questId, sessionId);
    if (!questUser) {
      return;
    }

    questUser.progress = progress;
    questUser.status = progress >= 100 ? 'ready_to_complete' : 'in_progress';
    this.replaceQuestUser(questUser);
    this.store.updateAllQuestStates();
  }

  private canStartSession(session: CollaborativeQuestSession): boolean {
    if (session.status !== 'pending' || session.owner_user_id !== this.store.currentUserId()) {
      return false;
    }

    const members = this.store.collaborativeMembers().filter(
      (member) => member.session_id === session.id && member.role !== 'owner',
    );
    const acceptedCount = members.filter((member) => member.status === 'accepted').length;
    const pendingCount = members.filter((member) => member.status === 'pending').length;
    return acceptedCount > 0 && pendingCount === 0;
  }

  private findSessionForMember(
    member?: CollaborativeQuestMember,
  ): CollaborativeQuestSession | undefined {
    return member
      ? this.store.collaborativeSessions().find((session) => session.id === member.session_id)
      : undefined;
  }

  private findCurrentUserOwnedOpenSession(questId: number): CollaborativeQuestSession | undefined {
    return this.store
      .collaborativeSessions()
      .filter(
        (session) =>
          session.quest_id === questId &&
          session.owner_user_id === this.store.currentUserId() &&
          session.status === 'pending',
      )
      .sort((a, b) => b.id - a.id)[0];
  }

  private replaceSession(session: CollaborativeQuestSession): void {
    this.store.collaborativeSessionsSignal.update((sessions) =>
      sessions.map((item) => (item.id === session.id ? session : item)),
    );
  }

  private replaceCollaborativeMember(member: CollaborativeQuestMember): void {
    this.store.collaborativeMembersSignal.update((members) =>
      members.map((item) => (item.id === member.id ? member : item)),
    );
  }

  private replaceQuestUser(questUser: QuestUser): void {
    this.store.questsUserSignal.update((questUsers) =>
      questUsers.map((item) => (item.id === questUser.id ? questUser : item)),
    );
  }

  private getNextMockId(): number {
    const id = this.mockId;
    this.mockId--;
    return id;
  }
}
