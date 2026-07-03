import { Injectable } from '@angular/core';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { Quest } from '../domain/model/quest.entity';
import { QuestsApiEndpoint } from './quests-api-endpoint';
import { QuestUser } from '../domain/model/quest-user.entity';
import { QuestsUserApiEndpoint } from './quests-user-api-endpoint';
import { MinigameAttempt } from '../domain/model/minigame-attempt.entity';
import { CreateMinigameAttemptPayload, FinishMinigameAttemptPayload, MinigameAttemptsApiEndpoint} from './minigame-attempts-api-endpoint';
import { Minigame } from '../domain/model/minigame.entity';
import { MinigamesApiEndpoint } from './minigames-api-endpoint';
import { Activity } from '../domain/model/activity.entity';
import { ActivitiesApiEndpoint } from './activities-api-endpoint';
import { ActivityUser } from '../domain/model/activity-user.entity';
import { ActivitiesUserApiEndpoint, SubmitActivityUserPayload } from './activities-user-api-endpoint';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CollaborativeQuestSession } from '../domain/model/collaborative-quest-session.entity';
import { CollaborativeQuestMember } from '../domain/model/collaborative-quest-member.entity';
import { CollaborativeQuestSessionsApiEndpoint } from './collaborative-quest-sessions-api-endpoint';
import { CollaborativeQuestMembersApiEndpoint } from './collaborative-quest-members-api-endpoint';
import { QuestSearchFilters } from './quest-search-filters';
import {
  CollaborativeQuestCountersResource,
  CollaborativeQuestPermissionsResource,
  CreateCollaborativeQuestSessionPayload,
} from './collaborative-quest-session-response';
import { InviteCollaborativeQuestMemberPayload } from './collaborative-quest-member-response';

@Injectable({
  providedIn: 'root',
})
export class QuestsApi extends BaseApi {
  private readonly questsEndpoint: QuestsApiEndpoint;
  private readonly questsUserEndpoint: QuestsUserApiEndpoint;
  private readonly minigamesEndpoint: MinigamesApiEndpoint;
  private readonly minigameAttemptsEndpoint: MinigameAttemptsApiEndpoint;
  private readonly activitiesEndpoint: ActivitiesApiEndpoint;
  private readonly activitiesUserEndpoint: ActivitiesUserApiEndpoint;
  private readonly collaborativeSessionsEndpoint: CollaborativeQuestSessionsApiEndpoint;
  private readonly collaborativeMembersEndpoint: CollaborativeQuestMembersApiEndpoint;

  constructor(http: HttpClient) {
    super();
    this.questsEndpoint = new QuestsApiEndpoint(http);
    this.questsUserEndpoint = new QuestsUserApiEndpoint(http);
    this.minigamesEndpoint = new MinigamesApiEndpoint(http);
    this.minigameAttemptsEndpoint = new MinigameAttemptsApiEndpoint(http);
    this.activitiesEndpoint = new ActivitiesApiEndpoint(http);
    this.activitiesUserEndpoint = new ActivitiesUserApiEndpoint(http);
    this.collaborativeSessionsEndpoint = new CollaborativeQuestSessionsApiEndpoint(http);
    this.collaborativeMembersEndpoint = new CollaborativeQuestMembersApiEndpoint(http);
  }

  //get all quests
  getQuests(): Observable<Quest[]> {
    return this.questsEndpoint.getAll();
  }

  searchQuests(filters: QuestSearchFilters): Observable<Quest[]> {
    return this.questsEndpoint.search(filters);
  }

  getQuestsUser(): Observable<QuestUser[]> {
    return this.questsUserEndpoint.getAll();
  }

  getQuestUserByUserAndQuest(userId: number, questId: number): Observable<QuestUser> {
    return this.questsUserEndpoint.getByUserAndQuest(userId, questId);
  }

  getQuestUsersByUserAndStatus(userId: number, status: string): Observable<QuestUser[]> {
    return this.questsUserEndpoint.getByUserAndStatus(userId, status);
  }

  createQuestUser(questUser: QuestUser): Observable<QuestUser> {
    return this.questsUserEndpoint.create(questUser);
  }

  updateQuestUser(questUser: QuestUser): Observable<QuestUser> {
    return this.questsUserEndpoint.update(questUser, questUser.id);
  }

  completeQuestUser(questUserId: number): Observable<QuestUser> {
    return this.questsUserEndpoint.complete(questUserId);
  }

  deleteQuestUser(id: number): Observable<void> {
    return this.questsUserEndpoint.delete(id);
  }

  getMinigames(): Observable<Minigame[]> {
    return this.minigamesEndpoint.getAll();
  }

  getMinigameAttempts(): Observable<MinigameAttempt[]> {
    return this.minigameAttemptsEndpoint.getAll();
  }

  getMinigameAttemptsByUserAndMinigame(
    userId: number,
    minigameId: number,
  ): Observable<MinigameAttempt[]> {
    return this.minigameAttemptsEndpoint.getByUserAndMinigame(userId, minigameId);
  }

  createMinigameAttempt(payload: CreateMinigameAttemptPayload): Observable<MinigameAttempt> {
    return this.minigameAttemptsEndpoint.createAttempt(payload);
  }

  finishMinigameAttempt(
    attemptId: number,
    payload: FinishMinigameAttemptPayload,
  ): Observable<MinigameAttempt> {
    return this.minigameAttemptsEndpoint.finishAttempt(attemptId, payload);
  }

  cancelMinigameAttempt(attemptId: number): Observable<MinigameAttempt> {
    return this.minigameAttemptsEndpoint.cancelAttempt(attemptId);
  }

  deleteMinigameAttempt(id: number): Observable<MinigameAttempt> {
    return this.cancelMinigameAttempt(id);
  }

  getActivities(): Observable<Activity[]> {
    return this.activitiesEndpoint.getAll();
  }

  getActivitiesByQuestId(questId: number): Observable<Activity[]> {
    return this.activitiesEndpoint.getByQuestId(questId);
  }

  getActivitiesUser(): Observable<ActivityUser[]> {
    return this.activitiesUserEndpoint.getAll();
  }

  getActivityUsersByQuestUserId(questUserId: number): Observable<ActivityUser[]> {
    return this.activitiesUserEndpoint.getByQuestUserId(questUserId);
  }

  createActivityUser(activityUser: ActivityUser): Observable<ActivityUser> {
    return this.activitiesUserEndpoint.create(activityUser);
  }

  updateActivityUser(activityUser: ActivityUser): Observable<ActivityUser> {
    return this.activitiesUserEndpoint.update(activityUser, activityUser.id);
  }

  submitActivityUser(
    activityUserId: number,
    payload: SubmitActivityUserPayload,
  ): Observable<ActivityUser> {
    return this.activitiesUserEndpoint.submit(activityUserId, payload);
  }

  deleteActivityUser(id: number): Observable<void> {
    return this.activitiesUserEndpoint.delete(id);
  }

  getCollaborativeQuestSessions(): Observable<CollaborativeQuestSession[]> {
    return this.collaborativeSessionsEndpoint.getAll();
  }

  createCollaborativeQuestSession(
    payload: CreateCollaborativeQuestSessionPayload,
  ): Observable<CollaborativeQuestSession> {
    return this.collaborativeSessionsEndpoint.createSession(payload);
  }

  startCollaborativeQuestSession(
    sessionId: number,
    ownerUserId: number,
  ): Observable<CollaborativeQuestSession> {
    return this.collaborativeSessionsEndpoint.startSession(sessionId, ownerUserId);
  }

  deletePendingCollaborativeQuestSession(
    sessionId: number,
    ownerUserId: number,
  ): Observable<void> {
    return this.collaborativeSessionsEndpoint.deletePendingSession(sessionId, ownerUserId);
  }

  getCollaborativeQuestState(
    questId: number,
    userId: number,
  ): Observable<{
    session: CollaborativeQuestSession | null;
    members: CollaborativeQuestMember[];
    currentMember: CollaborativeQuestMember | null;
    pendingInvitation: CollaborativeQuestMember | null;
    permissions: CollaborativeQuestPermissionsResource;
    counters: CollaborativeQuestCountersResource;
  }> {
    return this.collaborativeSessionsEndpoint.getState(questId, userId);
  }

  getCollaborativeQuestMembers(): Observable<CollaborativeQuestMember[]> {
    return this.collaborativeMembersEndpoint.getAll();
  }

  createCollaborativeQuestMember(
    payload: InviteCollaborativeQuestMemberPayload,
  ): Observable<CollaborativeQuestMember> {
    return this.collaborativeMembersEndpoint.invite(payload);
  }

  acceptCollaborativeQuestMember(memberId: number): Observable<CollaborativeQuestMember> {
    return this.collaborativeMembersEndpoint.accept(memberId);
  }

  declineCollaborativeQuestMember(memberId: number): Observable<CollaborativeQuestMember> {
    return this.collaborativeMembersEndpoint.decline(memberId);
  }

  leaveCollaborativeQuestMember(memberId: number): Observable<CollaborativeQuestMember> {
    return this.collaborativeMembersEndpoint.leave(memberId);
  }

  removeCollaborativeQuestMember(
    memberId: number,
    ownerUserId: number,
  ): Observable<CollaborativeQuestMember> {
    return this.collaborativeMembersEndpoint.remove(memberId, ownerUserId);
  }
}
