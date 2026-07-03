import { Injectable } from '@angular/core';
import { EMPTY, Observable, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { CollaborativeQuestMember } from '../domain/model/collaborative-quest-member.entity';
import { CollaborativeQuestSession } from '../domain/model/collaborative-quest-session.entity';
import { QuestUser } from '../domain/model/quest-user.entity';
import { CollaborativeQuestState, QuestsService } from './quests.service';

@Injectable({
  providedIn: 'root',
})
export class CollaborativeQuestsService {
  constructor(private readonly store: QuestsService) {}

  addInvitation(questId: number, friendUserId: number): void {
    const quest = this.store.quests().find((item) => item.id === questId);
    if (!quest || quest.type !== 'COLLABORATIVE') {
      return;
    }

    this.withLoading(
      this.ensureOwnedPendingSession(questId).pipe(
        switchMap((session) =>
          this.store.questsApi.createCollaborativeQuestMember({
            sessionId: session.id,
            invitedByUserId: this.store.currentUserId(),
            invitedUserId: friendUserId,
          }),
        ),
        tap((member) => this.replaceCollaborativeMember(member)),
        switchMap(() => this.syncCollaborativeState(questId)),
      ),
      'Failed to invite collaborative quest member',
    );
  }

  acceptInvitation(memberId: number): void {
    this.withLoading(
      this.store.questsApi.acceptCollaborativeQuestMember(memberId).pipe(
        tap((member) => this.replaceCollaborativeMember(member)),
        switchMap((member) => this.syncCollaborativeStateBySessionId(member.session_id)),
      ),
      'Failed to accept collaborative quest invitation',
    );
  }

  declineInvitation(memberId: number): void {
    this.withLoading(
      this.store.questsApi.declineCollaborativeQuestMember(memberId).pipe(
        tap((member) => this.replaceCollaborativeMember(member)),
        switchMap((member) => this.syncCollaborativeStateBySessionId(member.session_id)),
      ),
      'Failed to decline collaborative quest invitation',
    );
  }

  leaveQuest(memberId: number): void {
    this.withLoading(
      this.store.questsApi.leaveCollaborativeQuestMember(memberId).pipe(
        tap((member) => this.replaceCollaborativeMember(member)),
        switchMap((member) => this.syncCollaborativeStateBySessionId(member.session_id)),
      ),
      'Failed to leave collaborative quest',
    );
  }

  removeMember(memberId: number): void {
    this.withLoading(
      this.store.questsApi
        .removeCollaborativeQuestMember(memberId, this.store.currentUserId())
        .pipe(
          switchMap((member) => {
            const questId = this.findQuestIdBySessionId(member.session_id);
            this.replaceCollaborativeMember(member);
            if (this.shouldDeletePendingSession(member.session_id)) {
              return this.deletePendingSessionRequest(member.session_id, questId);
            }

            return this.syncCollaborativeStateBySessionId(member.session_id);
          }),
        ),
      'Failed to remove collaborative quest member',
    );
  }

  deletePendingSession(sessionId: number): void {
    const session = this.store.collaborativeSessions().find((item) => item.id === sessionId);
    if (!session) {
      return;
    }

    this.withLoading(
      this.deletePendingSessionRequest(sessionId, session.quest_id),
      'Failed to delete collaborative quest session',
    );
  }

  addQuestProgress(questId: number): void {
    const session = this.findCurrentUserOwnedPendingSession(questId);
    if (!session) {
      this.store.errorSignal.set('Failed to start collaborative quest: session not found');
      return;
    }

    this.withLoading(
      this.store.questsApi
        .startCollaborativeQuestSession(session.id, this.store.currentUserId())
        .pipe(
          tap((startedSession) => {
            this.replaceSession(startedSession);
            this.refreshCurrentQuestUser(questId);
          }),
          switchMap(() => this.syncCollaborativeState(questId)),
        ),
      'Failed to start collaborative quest',
    );
  }

  completeQuest(questId: number, sessionId: number): void {
    const questUser = this.store.findCurrentUserActiveQuest(questId, sessionId);
    if (!questUser) {
      return;
    }

    this.withLoading(
      this.store.questsApi.completeQuestUser(questUser.id).pipe(
        tap((completedQuestUser) => {
          this.store.questsUserSignal.update((questsUser) =>
            this.store.mergeById(questsUser, [completedQuestUser]),
          );
          this.store.refreshCurrentUserProfile();
          this.store.updateAllQuestStates();
        }),
        switchMap(() => this.syncCollaborativeState(questId)),
      ),
      'Failed to complete collaborative quest',
    );
  }

  updateActivityProgress(activityId: number, sessionId: number, progress: number): void {
    const activityUser = this.store.findCurrentUserActivity(activityId, sessionId);
    if (!activityUser) {
      this.store.errorSignal.set('Failed to update activity: assignment not found');
      return;
    }

    this.withLoading(
      this.store.questsApi
        .submitActivityUser(activityUser.id, { data: { checked: progress >= 100 } })
        .pipe(
          tap((updatedActivityUser) => {
            this.store.activitiesUserSignal.update((activitiesUser) =>
              this.store.mergeById(activitiesUser, [updatedActivityUser]),
            );
            this.store.refreshCurrentUserProfile();
            this.refreshCurrentQuestUserFromActivity(activityId);
          }),
        ),
      'Failed to update collaborative activity',
    );
  }

  refreshState(questId: number): void {
    this.syncCollaborativeState(questId).subscribe({
      error: (error) => {
        this.store.errorSignal.set(
          this.store.formatError(error, 'Failed to load collaborative quest state'),
        );
      },
    });
  }

  private syncCollaborativeState(questId: number): Observable<CollaborativeQuestState> {
    return this.store.questsApi.getCollaborativeQuestState(questId, this.store.currentUserId()).pipe(
      tap((state) => {
        const { session, members } = state;
        this.store.collaborativeStatesSignal.update((current) => ({
          ...current,
          [questId]: state,
        }));

        if (!session) {
          const removedSessionIds = this.store
            .collaborativeSessions()
            .filter((item) => item.quest_id === questId)
            .map((item) => item.id);
          this.store.collaborativeSessionsSignal.update((current) =>
            current.filter((item) => item.quest_id !== questId),
          );
          this.store.collaborativeMembersSignal.update((current) =>
            current.filter((member) => !removedSessionIds.includes(member.session_id)),
          );
          this.store.updateAllQuestStates();
          return;
        }

        this.replaceSession(session);
        this.store.collaborativeMembersSignal.update((current) => {
          const otherMembers = current.filter((member) => member.session_id !== session.id);
          return [...otherMembers, ...members];
        });
        this.store.updateAllQuestStates();
      }),
    );
  }

  private syncCollaborativeStateBySessionId(
    sessionId: number,
  ): Observable<CollaborativeQuestState | null> {
    const questId = this.findQuestIdBySessionId(sessionId);
    return questId ? this.syncCollaborativeState(questId) : of(null);
  }

  private deletePendingSessionRequest(
    sessionId: number,
    questId: number | undefined,
  ): Observable<CollaborativeQuestState | null> {
    return this.store.questsApi
      .deletePendingCollaborativeQuestSession(sessionId, this.store.currentUserId())
      .pipe(
        tap(() => {
          this.store.collaborativeSessionsSignal.update((sessions) =>
            sessions.filter((item) => item.id !== sessionId),
          );
          this.store.collaborativeMembersSignal.update((members) =>
            members.filter((member) => member.session_id !== sessionId),
          );
          this.store.updateAllQuestStates();
        }),
        switchMap(() => (questId ? this.syncCollaborativeState(questId) : of(null))),
      );
  }

  private findQuestIdBySessionId(sessionId: number): number | undefined {
    return this.store.collaborativeSessions().find((item) => item.id === sessionId)?.quest_id;
  }

  private ensureOwnedPendingSession(questId: number): Observable<CollaborativeQuestSession> {
    const currentSession = this.findCurrentUserOwnedPendingSession(questId);
    if (currentSession) {
      return of(currentSession);
    }

    return this.store.questsApi
      .createCollaborativeQuestSession({
        questId,
        ownerUserId: this.store.currentUserId(),
      })
      .pipe(
        tap((session) => {
          this.replaceSession(session);
          this.refreshState(questId);
        }),
      );
  }

  private refreshCurrentQuestUser(questId: number): void {
    this.store.questsApi
      .getQuestUserByUserAndQuest(this.store.currentUserId(), questId)
      .subscribe({
        next: (questUser) => {
          this.replaceQuestUser(questUser);
          this.store.loadActivityUsersByQuestUserId(questUser.id);
          this.store.updateAllQuestStates();
        },
      });
  }

  private refreshCurrentQuestUserFromActivity(activityId: number): void {
    const activity = this.store.activities().find((item) => item.id === activityId);
    if (activity) {
      this.refreshCurrentQuestUser(activity.quest_id);
    }
  }

  private findCurrentUserOwnedPendingSession(
    questId: number,
  ): CollaborativeQuestSession | undefined {
    return this.store
      .collaborativeSessions()
      .filter(
        (session) =>
          session.quest_id === questId &&
          session.owner_user_id === this.store.currentUserId() &&
          session.status === 'PENDING',
      )
      .sort((a, b) => b.id - a.id)[0];
  }

  private replaceSession(session: CollaborativeQuestSession): void {
    this.store.collaborativeSessionsSignal.update((sessions) =>
      this.store.mergeById(sessions, [session]),
    );
  }

  private replaceCollaborativeMember(member: CollaborativeQuestMember): void {
    this.store.collaborativeMembersSignal.update((members) =>
      this.store.mergeById(members, [member]),
    );
  }

  private replaceQuestUser(questUser: QuestUser): void {
    this.store.questsUserSignal.update((questUsers) =>
      this.store.mergeById(questUsers, [questUser]),
    );
  }

  private shouldDeletePendingSession(sessionId: number): boolean {
    const session = this.store.collaborativeSessions().find((item) => item.id === sessionId);
    if (
      !session ||
      session.status !== 'PENDING' ||
      session.owner_user_id !== this.store.currentUserId()
    ) {
      return false;
    }

    return !this.store.collaborativeMembers().some(
      (member) =>
        member.session_id === sessionId &&
        member.role !== 'OWNER' &&
        ['ACCEPTED', 'PENDING'].includes(member.status),
    );
  }

  private withLoading<T>(request: Observable<T>, fallbackError: string): void {
    this.store.loadingSignal.set(true);
    this.store.errorSignal.set(null);
    request
      .pipe(
        catchError((error) => {
          this.store.errorSignal.set(this.store.formatError(error, fallbackError));
          return EMPTY;
        }),
      )
      .subscribe({
        complete: () => this.store.loadingSignal.set(false),
      });
  }
}
