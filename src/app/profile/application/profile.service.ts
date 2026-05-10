import { computed, inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { CurrentUser } from '../../shared/application/current-user';
import { Family } from '../domain/model/family.entity';
import { FamilyUser } from '../domain/model/family-user.entity';
import { Friend } from '../domain/model/friend.entity';
import { User } from '../domain/model/user.entity';
import { ProfileApi } from '../infrastructure/profile-api';

export interface FamilyMemberSummary {
  user: User;
  relation: FamilyUser;
}

export interface FamilySummary {
  family: Family;
  members: FamilyMemberSummary[];
}

export interface ProfileSummary {
  user: User;
  acceptedFriendsCount: number;
  primaryFamily: Family | null;
}

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly profileApi = inject(ProfileApi);
  private readonly currentUser = inject(CurrentUser);

  readonly currentUserId = computed(() => this.currentUser.getCurrentUserId());

  getCurrentUser(): Observable<User> {
    return this.profileApi.getUser(this.currentUserId());
  }

  getUser(userId: number): Observable<User> {
    return this.profileApi.getUser(userId);
  }

  updateUser(user: User): Observable<User> {
    return this.profileApi.updateUser(user);
  }

  getCurrentUserProfileSummary(): Observable<ProfileSummary> {
    return forkJoin({
      user: this.getCurrentUser(),
      acceptedFriendsCount: this.getAcceptedFriendsCount(),
      primaryFamily: this.getCurrentUserPrimaryFamily(),
    });
  }

  updateCurrentUserCommitment(commitment: string | null): Observable<User> {
    return this.getCurrentUser().pipe(
      switchMap((user) => {
        user.commitment = commitment;
        return this.profileApi.updateUser(user);
      }),
    );
  }

  clearCurrentUserCommitment(): Observable<User> {
    return this.updateCurrentUserCommitment(null);
  }

  getCurrentUserFamilyUsers(): Observable<FamilyUser[]> {
    return this.profileApi.getFamilyUsersByUserId(this.currentUserId());
  }

  getCurrentUserFamilies(): Observable<Family[]> {
    return this.getCurrentUserFamilyUsers().pipe(
      switchMap((familyUsers) =>
        this.profileApi.getFamilies().pipe(
          map((families) =>
            families.filter((family) =>
              familyUsers.some((familyUser) => familyUser.family_id === family.id),
            ),
          ),
        ),
      ),
    );
  }

  getCurrentUserPrimaryFamily(): Observable<Family | null> {
    return this.getCurrentUserFamilies().pipe(map((families) => families[0] ?? null));
  }

  getFamilyMembers(familyId: number): Observable<FamilyMemberSummary[]> {
    return forkJoin({
      users: this.profileApi.getUsers(),
      relations: this.profileApi.getFamilyUsersByFamilyId(familyId),
    }).pipe(
      map(({ users, relations }) =>
        relations
          .map((relation) => {
            const user = users.find((item) => item.id === relation.user_id);
            return user ? { user, relation } : null;
          })
          .filter((item): item is FamilyMemberSummary => item !== null),
      ),
    );
  }

  getCurrentUserFamilySummary(): Observable<FamilySummary | null> {
    return this.getCurrentUserPrimaryFamily().pipe(
      switchMap((family) => {
        if (!family) {
          return of(null);
        }

        return this.getFamilyMembers(family.id).pipe(
          map((members) => ({
            family,
            members,
          })),
        );
      }),
    );
  }

  getFriendRelations(userId = this.currentUserId()): Observable<Friend[]> {
    return this.profileApi.getFriendsByUserId(userId);
  }

  getAcceptedFriendRelations(userId = this.currentUserId()): Observable<Friend[]> {
    return this.profileApi.getAcceptedFriendsByUserId(userId);
  }

  getAcceptedFriendsCount(userId = this.currentUserId()): Observable<number> {
    return this.getAcceptedFriendRelations(userId).pipe(map((friends) => friends.length));
  }

  getFriendUsers(userId = this.currentUserId()): Observable<User[]> {
    return forkJoin({
      users: this.profileApi.getUsers(),
      friends: this.getAcceptedFriendRelations(userId),
    }).pipe(
      map(({ users, friends }) =>
        friends
          .map((friend) => (friend.user_id === userId ? friend.friend_id : friend.user_id))
          .map((friendId) => users.find((user) => user.id === friendId))
          .filter((user): user is User => Boolean(user)),
      ),
    );
  }

  getUserGemBalance(userId = this.currentUserId()): Observable<number> {
    return this.profileApi.getUser(userId).pipe(map((user) => user.gem_balance));
  }

  updateUserGemBalance(gemBalance: number, userId = this.currentUserId()): Observable<User> {
    return this.profileApi.getUser(userId).pipe(
      switchMap((user) => {
        user.gem_balance = gemBalance;
        return this.profileApi.updateUser(user);
      }),
    );
  }

  increaseUserGemBalance(amount: number, userId = this.currentUserId()): Observable<User> {
    return this.profileApi.getUser(userId).pipe(
      switchMap((user) => {
        user.gem_balance += amount;
        return this.profileApi.updateUser(user);
      }),
    );
  }

  getUserEcoPoints(userId = this.currentUserId()): Observable<number> {
    return this.profileApi.getUser(userId).pipe(map((user) => user.ecopoints));
  }

  updateUserEcoPoints(ecopoints: number, userId = this.currentUserId()): Observable<User> {
    return this.profileApi.getUser(userId).pipe(
      switchMap((user) => {
        user.ecopoints = ecopoints;
        return this.profileApi.updateUser(user);
      }),
    );
  }

  increaseUserEcoPoints(amount: number, userId = this.currentUserId()): Observable<User> {
    return this.profileApi.getUser(userId).pipe(
      switchMap((user) => {
        user.ecopoints += amount;
        return this.profileApi.updateUser(user);
      }),
    );
  }

  getUserStreak(userId = this.currentUserId()): Observable<number> {
    return this.profileApi.getUser(userId).pipe(map((user) => user.streak));
  }

  updateUserStreak(streak: number, userId = this.currentUserId()): Observable<User> {
    return this.profileApi.getUser(userId).pipe(
      switchMap((user) => {
        user.streak = streak;
        return this.profileApi.updateUser(user);
      }),
    );
  }

  increaseUserStreak(amount = 1, userId = this.currentUserId()): Observable<User> {
    return this.profileApi.getUser(userId).pipe(
      switchMap((user) => {
        user.streak += amount;
        return this.profileApi.updateUser(user);
      }),
    );
  }
}
