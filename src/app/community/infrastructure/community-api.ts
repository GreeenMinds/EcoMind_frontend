import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable, of } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { Achievement } from '../domain/model/achievement.entity';
import { CommunityAchievement } from '../domain/model/community-achievement.entity';
import { CommunityGoal } from '../domain/model/community-goal.entity';
import { Goal } from '../domain/model/goal.entity';
import { CommunityMember } from '../domain/model/community-member.entity';
import { CommunityPost } from '../domain/model/community-post.entity';
import { CommunityPostReaction } from '../domain/model/community-post-reaction.entity';
import { Community } from '../domain/model/community.entity';
import { EventRegistration } from '../domain/model/event-registration.entity';
import { Event } from '../domain/model/event.entity';
import { UserAchievement } from '../domain/model/user-achievement.entity';
import { AchievementsApiEndpoint } from './achievements-api-endpoint';
import { CommunitiesApiEndpoint } from './communities-api-endpoint';
import { CommunityAchievementsApiEndpoint } from './community-achievements-api-endpoint';
import { CommunityGoalsApiEndpoint } from './community-goals-api-endpoint';
import { CommunityMembersApiEndpoint } from './community-members-api-endpoint';
import { CommunityPostsApiEndpoint } from './community-posts-api-endpoint';
import { CommunityPostReactionsApiEndpoint } from './community-post-reactions-api-endpoint';
import { EventRegistrationsApiEndpoint } from './event-registrations-api-endpoint';
import { EventsApiEndpoint } from './events-api-endpoint';
import { GoalsApiEndpoint } from './goals-api-endpoint';
import { UserAchievementsApiEndpoint } from './user-achievements-api-endpoint';

@Injectable({
  providedIn: 'root',
})
export class CommunityApi extends BaseApi {
  private readonly communitiesEndpoint: CommunitiesApiEndpoint;
  private readonly membersEndpoint: CommunityMembersApiEndpoint;
  private readonly postsEndpoint: CommunityPostsApiEndpoint;
  private readonly postReactionsEndpoint: CommunityPostReactionsApiEndpoint;
  private readonly goalCatalogEndpoint: GoalsApiEndpoint;
  private readonly goalsEndpoint: CommunityGoalsApiEndpoint;
  private readonly achievementsEndpoint: AchievementsApiEndpoint;
  private readonly communityAchievementsEndpoint: CommunityAchievementsApiEndpoint;
  private readonly userAchievementsEndpoint: UserAchievementsApiEndpoint;
  private readonly eventsEndpoint: EventsApiEndpoint;
  private readonly eventRegistrationsEndpoint: EventRegistrationsApiEndpoint;

  constructor(http: HttpClient) {
    super();
    this.communitiesEndpoint = new CommunitiesApiEndpoint(http);
    this.membersEndpoint = new CommunityMembersApiEndpoint(http);
    this.postsEndpoint = new CommunityPostsApiEndpoint(http);
    this.postReactionsEndpoint = new CommunityPostReactionsApiEndpoint(http);
    this.goalCatalogEndpoint = new GoalsApiEndpoint(http);
    this.goalsEndpoint = new CommunityGoalsApiEndpoint(http);
    this.achievementsEndpoint = new AchievementsApiEndpoint(http);
    this.communityAchievementsEndpoint = new CommunityAchievementsApiEndpoint(http);
    this.userAchievementsEndpoint = new UserAchievementsApiEndpoint(http);
    this.eventsEndpoint = new EventsApiEndpoint(http);
    this.eventRegistrationsEndpoint = new EventRegistrationsApiEndpoint(http);
  }

  getCommunities(): Observable<Community[]> {
    return this.communitiesEndpoint.getAll();
  }

  getCommunityMembers(): Observable<CommunityMember[]> {
    return this.membersEndpoint.getAll();
  }

  getCommunityPosts(): Observable<CommunityPost[]> {
    return this.postsEndpoint.getAll();
  }

  createPost(post: CommunityPost): Observable<CommunityPost> {
    return this.postsEndpoint.create(post);
  }

  updatePost(post: CommunityPost): Observable<CommunityPost> {
    return this.postsEndpoint.update(post, post.id);
  }

  getPostReactions(): Observable<CommunityPostReaction[]> {
    return this.postReactionsEndpoint.getAll();
  }

  createPostReaction(reaction: CommunityPostReaction): Observable<CommunityPostReaction> {
    return this.postReactionsEndpoint.create(reaction);
  }

  updatePostReaction(reaction: CommunityPostReaction): Observable<CommunityPostReaction> {
    return this.postReactionsEndpoint.updateReactionType(reaction);
  }

  deletePostReaction(id: number): Observable<void> {
    return this.postReactionsEndpoint.delete(id);
  }

  getCommunityGoals(): Observable<CommunityGoal[]> {
    return this.goalsEndpoint.getAll();
  }

  getGoals(): Observable<Goal[]> {
    return this.goalCatalogEndpoint.getAll();
  }

  getGoalById(id: number): Observable<Goal> {
    return this.goalCatalogEndpoint.getById(id);
  }

  createGoal(goal: Goal): Observable<Goal> {
    return this.goalCatalogEndpoint.create(goal);
  }

  updateGoal(goal: Goal): Observable<Goal> {
    return this.goalCatalogEndpoint.update(goal, goal.id);
  }

  deleteGoal(id: number): Observable<void> {
    return this.goalCatalogEndpoint.delete(id);
  }

  getAchievements(): Observable<Achievement[]> {
    return this.achievementsEndpoint.getAll();
  }

  getCommunityAchievements(): Observable<CommunityAchievement[]> {
    return this.communityAchievementsEndpoint.getAll();
  }

  getCommunityAchievementsByCommunityId(communityId: number): Observable<CommunityAchievement[]> {
    return this.communityAchievementsEndpoint.getByCommunityId(communityId);
  }

  getUserAchievements(): Observable<UserAchievement[]> {
    return this.userAchievementsEndpoint.getAll();
  }

  getUserAchievementsByUserId(userId: number): Observable<UserAchievement[]> {
    return this.userAchievementsEndpoint.getByUserId(userId);
  }

  getEvents(): Observable<Event[]> {
    return this.eventsEndpoint.getAll();
  }

  createEvent(event: Event): Observable<Event> {
    return this.eventsEndpoint.create(event);
  }

  updateEvent(event: Event): Observable<Event> {
    return this.eventsEndpoint.update(event, event.id);
  }

  deleteEvent(id: number, authorId: number): Observable<void> {
    return this.eventsEndpoint.deleteEvent(id, authorId);
  }

  getEventRegistrations(eventId: number): Observable<EventRegistration[]> {
    return this.eventRegistrationsEndpoint.getByEvent(eventId);
  }

  getEventRegistrationsForEvents(eventIds: number[]): Observable<EventRegistration[]> {
    if (eventIds.length === 0) {
      return of([]);
    }

    return forkJoin(eventIds.map((eventId) => this.getEventRegistrations(eventId))).pipe(
      map((registrations) => registrations.flat()),
    );
  }

  createEventRegistration(registration: EventRegistration): Observable<EventRegistration> {
    return this.eventRegistrationsEndpoint.createForEvent(registration.event_id, registration);
  }

  cancelEventRegistration(registration: EventRegistration): Observable<EventRegistration> {
    return this.eventRegistrationsEndpoint.cancel(registration.event_id, registration.id);
  }
}
