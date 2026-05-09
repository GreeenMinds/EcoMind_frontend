import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { User } from '../domain/model/user.entity';
import { Family } from '../domain/model/family.entity';
import { FamilyUser } from '../domain/model/family-user.entity';
import { Friend } from '../domain/model/friend.entity';
import { UsersApiEndpoint } from './users-api-endpoint';
import { FamiliesApiEndpoint } from './families-api-endpoint';
import { FamilyUsersApiEndpoint } from './family-users-api-endpoint';
import { FriendsApiEndpoint } from './friends-api-endpoint';

@Injectable({
  providedIn: 'root',
})
export class ProfileApi extends BaseApi {
  private readonly usersEndpoint: UsersApiEndpoint;
  private readonly familiesEndpoint: FamiliesApiEndpoint;
  private readonly familyUsersEndpoint: FamilyUsersApiEndpoint;
  private readonly friendsEndpoint: FriendsApiEndpoint;

  constructor(http: HttpClient) {
    super();
    this.usersEndpoint = new UsersApiEndpoint(http);
    this.familiesEndpoint = new FamiliesApiEndpoint(http);
    this.familyUsersEndpoint = new FamilyUsersApiEndpoint(http);
    this.friendsEndpoint = new FriendsApiEndpoint(http);
  }

  getUsers(): Observable<User[]> {
    return this.usersEndpoint.getAll();
  }

  getUser(id: number): Observable<User> {
    return this.usersEndpoint.getById(id);
  }

  createUser(user: User): Observable<User> {
    return this.usersEndpoint.create(user);
  }

  updateUser(user: User): Observable<User> {
    return this.usersEndpoint.update(user, user.id);
  }

  deleteUser(id: number): Observable<void> {
    return this.usersEndpoint.delete(id);
  }

  getFamilies(): Observable<Family[]> {
    return this.familiesEndpoint.getAll();
  }

  getFamily(id: number): Observable<Family> {
    return this.familiesEndpoint.getById(id);
  }

  createFamily(family: Family): Observable<Family> {
    return this.familiesEndpoint.create(family);
  }

  updateFamily(family: Family): Observable<Family> {
    return this.familiesEndpoint.update(family, family.id);
  }

  deleteFamily(id: number): Observable<void> {
    return this.familiesEndpoint.delete(id);
  }

  getFamilyUsers(): Observable<FamilyUser[]> {
    return this.familyUsersEndpoint.getAll();
  }

  getFamilyUsersByUserId(userId: number): Observable<FamilyUser[]> {
    return this.getFamilyUsers().pipe(
      map((familyUsers) => familyUsers.filter((familyUser) => familyUser.user_id === userId)),
    );
  }

  createFamilyUser(familyUser: FamilyUser): Observable<FamilyUser> {
    return this.familyUsersEndpoint.create(familyUser);
  }

  updateFamilyUser(familyUser: FamilyUser): Observable<FamilyUser> {
    return this.familyUsersEndpoint.update(familyUser, familyUser.id);
  }

  deleteFamilyUser(id: number): Observable<void> {
    return this.familyUsersEndpoint.delete(id);
  }

  getFriends(): Observable<Friend[]> {
    return this.friendsEndpoint.getAll();
  }

  getFriendsByUserId(userId: number): Observable<Friend[]> {
    return this.getFriends().pipe(
      map((friends) =>
        friends.filter((friend) => friend.user_id === userId || friend.friend_id === userId),
      ),
    );
  }

  createFriend(friend: Friend): Observable<Friend> {
    return this.friendsEndpoint.create(friend);
  }

  updateFriend(friend: Friend): Observable<Friend> {
    return this.friendsEndpoint.update(friend, friend.id);
  }

  deleteFriend(id: number): Observable<void> {
    return this.friendsEndpoint.delete(id);
  }
}
