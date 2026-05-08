import { Injectable } from '@angular/core';
import {BaseApi} from '../../shared/infrastructure/base-api';
import {Quest} from '../domain/model/quest.entity';
import {QuestsApiEndpoint} from './quests-api-endpoint';
import {QuestUser} from '../domain/model/quest-user.entity';
import {QuestsUserApiEndpoint} from './quests-user-api-endpoint';
import {MinigameAttempt} from '../domain/model/minigame-attempt.entity';
import {MinigameAttemptsApiEndpoint} from './minigame-attempts-api-endpoint';
import {Minigame} from '../domain/model/minigame.entity';
import { MinigamesApiEndpoint } from './minigames-api-endpoint';
import {Activity} from '../domain/model/activity.entity';
import {ActivitiesApiEndpoint} from './activities-api-endpoint';
import {ActivityUser} from '../domain/model/activity-user.entity';
import {ActivitiesUserApiEndpoint} from './activities-user-api-endpoint';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';

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

  constructor(http: HttpClient) {
    super();
    this.questsEndpoint = new QuestsApiEndpoint(http);
    this.questsUserEndpoint = new QuestsUserApiEndpoint(http);
    this.minigamesEndpoint = new MinigamesApiEndpoint(http);
    this.minigameAttemptsEndpoint = new MinigameAttemptsApiEndpoint(http);
    this.activitiesEndpoint = new ActivitiesApiEndpoint(http);
    this.activitiesUserEndpoint = new ActivitiesUserApiEndpoint(http);
  }

  //get all quests
  getQuests(): Observable<Quest[]> {
    return this.questsEndpoint.getAll();
  }

  //get quest by id
  getQuest(id: number): Observable<Quest> {
    return this.questsEndpoint.getById(id);
  }

  //create quest
  createQuest(quest: Quest): Observable<Quest> {
    return this.questsEndpoint.create(quest);
  }

  updateQuest(quest: Quest): Observable<Quest> {
    return this.questsEndpoint.update(quest, quest.id);
  }

  deleteQuest(id: number): Observable<void> {
    return this.questsEndpoint.delete(id);
  }

  getQuestsUser(): Observable<QuestUser[]> {
    return this.questsUserEndpoint.getAll();
  }

  getQuestUser(id: number): Observable<QuestUser> {
    return this.questsUserEndpoint.getById(id);
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

  getMinigame(id: number): Observable<Minigame> {
    return this.minigamesEndpoint.getById(id);
  }

  createMinigame(minigame: Minigame): Observable<Minigame> {
    return this.minigamesEndpoint.create(minigame);
  }

  updateMinigame(minigame: Minigame): Observable<Minigame> {
    return this.minigamesEndpoint.update(minigame, minigame.id);
  }

  deleteMinigame(id: number): Observable<void> {
    return this.minigamesEndpoint.delete(id);
  }

  getMinigameAttempts(): Observable<MinigameAttempt[]> {
    return this.minigameAttemptsEndpoint.getAll();
  }

  getMinigameAttempt(id: number): Observable<MinigameAttempt> {
    return this.minigameAttemptsEndpoint.getById(id);
  }

  createMinigameAttempt(minigameAttempt: MinigameAttempt): Observable<MinigameAttempt> {
    return this.minigameAttemptsEndpoint.create(minigameAttempt);
  }

  updateMinigameAttempt(minigameAttempt: MinigameAttempt): Observable<MinigameAttempt> {
    return this.minigameAttemptsEndpoint.update(minigameAttempt, minigameAttempt.id);
  }

  deleteMinigameAttempt(id: number): Observable<void> {
    return this.minigameAttemptsEndpoint.delete(id);
  }

  getActivities(): Observable<Activity[]> {
    return this.activitiesEndpoint.getAll();
  }

  getActivity(id: number): Observable<Activity> {
    return this.activitiesEndpoint.getById(id);
  }

  createActivity(activity: Activity): Observable<Activity> {
    return this.activitiesEndpoint.create(activity);
  }

  updateActivity(activity: Activity): Observable<Activity> {
    return this.activitiesEndpoint.update(activity, activity.id);
  }

  deleteActivity(id: number): Observable<void> {
    return this.activitiesEndpoint.delete(id);
  }

  getActivitiesUser(): Observable<ActivityUser[]> {
    return this.activitiesUserEndpoint.getAll();
  }

  getActivityUser(id: number): Observable<ActivityUser> {
    return this.activitiesUserEndpoint.getById(id);
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

  getActivitiesByQuestId(questId: number): Observable<Activity[]> {
    return this.activitiesEndpoint.getAll().pipe(
      map((activities) => activities.filter((activity) => activity.quest_id === questId)),
    );
  }

  getQuestsUserByUserId(userId: number): Observable<QuestUser[]> {
    return this.questsUserEndpoint.getAll().pipe(
      map((questsUser) => questsUser.filter((questUser) => questUser.user_id === userId)),
    );
  }

  getActivitiesUserByUserId(userId: number): Observable<ActivityUser[]> {
    return this.activitiesUserEndpoint.getAll().pipe(
      map((activitiesUser) => activitiesUser.filter((activityUser) => activityUser.user_id === userId)),
    );
  }

  getMinigameAttemptsByUserId(userId: number): Observable<MinigameAttempt[]> {
    return this.minigameAttemptsEndpoint.getAll().pipe(
      map((minigameAttempts) => minigameAttempts.filter((minigameAttempt) => minigameAttempt.user_id === userId)),
    );
  }

  getMinigameAttemptsByQuestId(questId: number): Observable<MinigameAttempt[]> {
    return this.minigameAttemptsEndpoint.getAll().pipe(
      map((minigameAttempts) => minigameAttempts.filter((minigameAttempt) => minigameAttempt.quest_id === questId)),
    );
  }
}
