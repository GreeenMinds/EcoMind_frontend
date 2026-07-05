import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { User } from '../domain/model/user.entity';
import { Family } from '../domain/model/family.entity';
import { FamilyUser } from '../domain/model/family-user.entity';
import { Friend } from '../domain/model/friend.entity';
import { FamilyInvitation } from '../domain/model/family-invitation.entity';
import { Notification } from '../domain/model/notification.entity';
import { UsersApiEndpoint } from './users-api-endpoint';
import { FamiliesApiEndpoint } from './families-api-endpoint';
import { FamilyUsersApiEndpoint } from './family-users-api-endpoint';
import { FriendsApiEndpoint } from './friends-api-endpoint';
import { FamilyInvitationsApiEndpoint } from './family-invitations-api-endpoint';
import { NotificationsApiEndpoint } from './notifications-api-endpoint';

@Injectable({
  providedIn: 'root',
})
export class ProfileApi extends BaseApi {
  private readonly usersEndpoint: UsersApiEndpoint;
  private readonly familiesEndpoint: FamiliesApiEndpoint;
  private readonly familyUsersEndpoint: FamilyUsersApiEndpoint;
  private readonly friendsEndpoint: FriendsApiEndpoint;
  private readonly familyInvitationsEndpoint: FamilyInvitationsApiEndpoint;
  private readonly notificationsEndpoint: NotificationsApiEndpoint;

  constructor(http: HttpClient) {
    super();
    this.usersEndpoint = new UsersApiEndpoint(http);
    this.familiesEndpoint = new FamiliesApiEndpoint(http);
    this.familyUsersEndpoint = new FamilyUsersApiEndpoint(http);
    this.friendsEndpoint = new FriendsApiEndpoint(http);
    this.familyInvitationsEndpoint = new FamilyInvitationsApiEndpoint(http);
    this.notificationsEndpoint = new NotificationsApiEndpoint(http);
  }

  getUsers(): Observable<User[]> {
    return this.usersEndpoint.getAll();
  }

  getUser(id: number): Observable<User> {
    return this.usersEndpoint.getById(id);
  }

  updateUser(user: User): Observable<User> {
    return this.usersEndpoint.update(user, user.id);
  }

  getFamilies(): Observable<Family[]> {
    return this.familiesEndpoint.getAll();
  }

  createFamily(family: Family): Observable<Family> {
    return this.familiesEndpoint.create(family);
  }

  updateFamily(family: Family): Observable<Family> {
    return this.familiesEndpoint.update(family, family.id);
  }

  getFamilyUsers(): Observable<FamilyUser[]> {
    return this.familyUsersEndpoint.getAll();
  }

  createFamilyUser(familyUser: FamilyUser): Observable<FamilyUser> {
    return this.familyUsersEndpoint.create(familyUser);
  }

  deleteFamilyUser(id: number): Observable<void> {
    return this.familyUsersEndpoint.delete(id);
  }

  getFamilyInvitations(): Observable<FamilyInvitation[]> {
    return this.familyInvitationsEndpoint.getAll();
  }

  createFamilyInvitation(invitation: FamilyInvitation): Observable<FamilyInvitation> {
    return this.familyInvitationsEndpoint.create(invitation);
  }

  updateFamilyInvitation(invitation: FamilyInvitation): Observable<FamilyInvitation> {
    return this.familyInvitationsEndpoint.update(invitation, invitation.id);
  }

  getFriends(): Observable<Friend[]> {
    return this.friendsEndpoint.getAll();
  }

  getFriendsByUser(userId: number, status?: string): Observable<Friend[]> {
    return this.friendsEndpoint.getByUser(userId, status);
  }

  createFriend(friend: Friend): Observable<Friend> {
    return this.friendsEndpoint.create(friend);
  }

  updateFriend(friend: Friend): Observable<Friend> {
    return this.friendsEndpoint.update(friend, friend.id);
  }

  acceptFriend(friendId: number): Observable<Friend> {
    return this.friendsEndpoint.accept(friendId);
  }

  rejectFriend(friendId: number): Observable<Friend> {
    return this.friendsEndpoint.reject(friendId);
  }

  deleteFriend(id: number): Observable<void> {
    return this.friendsEndpoint.delete(id);
  }

  getNotifications(userId: number): Observable<Notification[]> {
    return this.notificationsEndpoint.getByUser(userId);
  }

  getUnreadNotificationCount(userId: number): Observable<number> {
    return this.notificationsEndpoint.getUnreadCount(userId);
  }

  markNotificationAsRead(notificationId: number): Observable<Notification> {
    return this.notificationsEndpoint.markAsRead(notificationId);
  }

  markAllNotificationsAsRead(userId: number): Observable<Notification[]> {
    return this.notificationsEndpoint.markAllAsRead(userId);
  }
}
