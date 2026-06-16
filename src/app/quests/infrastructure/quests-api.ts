import { Injectable } from '@angular/core';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { Quest } from '../domain/model/quest.entity';
import { QuestsApiEndpoint } from './quests-api-endpoint';
import { QuestUser } from '../domain/model/quest-user.entity';
import { QuestsUserApiEndpoint } from './quests-user-api-endpoint';
import { MinigameAttempt } from '../domain/model/minigame-attempt.entity';
import { MinigameAttemptsApiEndpoint } from './minigame-attempts-api-endpoint';
import { Minigame } from '../domain/model/minigame.entity';
import { MinigamesApiEndpoint } from './minigames-api-endpoint';
import { Activity } from '../domain/model/activity.entity';
import { ActivitiesApiEndpoint } from './activities-api-endpoint';
import { ActivityUser } from '../domain/model/activity-user.entity';
import { ActivitiesUserApiEndpoint } from './activities-user-api-endpoint';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CollaborativeQuestSession } from '../domain/model/collaborative-quest-session.entity';
import { CollaborativeQuestMember } from '../domain/model/collaborative-quest-member.entity';
import { CollaborativeQuestSessionsApiEndpoint } from './collaborative-quest-sessions-api-endpoint';
import { CollaborativeQuestMembersApiEndpoint } from './collaborative-quest-members-api-endpoint';

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

  getQuestsUser(): Observable<QuestUser[]> {
    return this.questsUserEndpoint.getAll();
  }

  createQuestUser(questUser: QuestUser): Observable<QuestUser> {
    return this.questsUserEndpoint.create(questUser);
  }

  updateQuestUser(questUser: QuestUser): Observable<QuestUser> {
    return this.questsUserEndpoint.update(questUser, questUser.id);
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

  deleteMinigameAttempt(id: number): Observable<void> {
    return this.minigameAttemptsEndpoint.delete(id);
  }

  getActivities(): Observable<Activity[]> {
    return this.activitiesEndpoint.getAll();
  }

  getActivitiesUser(): Observable<ActivityUser[]> {
    return this.activitiesUserEndpoint.getAll();
  }

  createActivityUser(activityUser: ActivityUser): Observable<ActivityUser> {
    return this.activitiesUserEndpoint.create(activityUser);
  }

  updateActivityUser(activityUser: ActivityUser): Observable<ActivityUser> {
    return this.activitiesUserEndpoint.update(activityUser, activityUser.id);
  }

  deleteActivityUser(id: number): Observable<void> {
    return this.activitiesUserEndpoint.delete(id);
  }

  getCollaborativeQuestSessions(): Observable<CollaborativeQuestSession[]> {
    return this.collaborativeSessionsEndpoint.getAll();
  }

  createCollaborativeQuestSession(
    session: CollaborativeQuestSession,
  ): Observable<CollaborativeQuestSession> {
    return this.collaborativeSessionsEndpoint.create(session);
  }

  updateCollaborativeQuestSession(
    session: CollaborativeQuestSession,
  ): Observable<CollaborativeQuestSession> {
    return this.collaborativeSessionsEndpoint.update(session, session.id);
  }

  getCollaborativeQuestMembers(): Observable<CollaborativeQuestMember[]> {
    return this.collaborativeMembersEndpoint.getAll();
  }

  createCollaborativeQuestMember(
    member: CollaborativeQuestMember,
  ): Observable<CollaborativeQuestMember> {
    return this.collaborativeMembersEndpoint.create(member);
  }

  updateCollaborativeQuestMember(
    member: CollaborativeQuestMember,
  ): Observable<CollaborativeQuestMember> {
    return this.collaborativeMembersEndpoint.update(member, member.id);
  }
}
