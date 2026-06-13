import { computed, inject, Injectable, signal } from '@angular/core';
import { map, Observable, switchMap, tap } from 'rxjs';
import { CurrentUser } from '../../shared/application/current-user';
import { User } from '../domain/model/user.entity';
import { Family } from '../domain/model/family.entity';
import { FamilyUser } from '../domain/model/family-user.entity';
import { Friend } from '../domain/model/friend.entity';
import { FamilyInvitation } from '../domain/model/family-invitation.entity';
import { ProfileApi } from '../infrastructure/profile-api';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly profileApi = inject(ProfileApi);
  private readonly currentUser = inject(CurrentUser);
  private readonly currentUserSignal = signal<User | null>(null);

  readonly currentUserId = computed(() => this.currentUser.getCurrentUserId());
  readonly currentUserProfile = this.currentUserSignal.asReadonly();

  /**
   * Sincroniza el balance de gemas del usuario actual.
   */
  syncGemBalance(newBalance: number): void {
    if (this.currentUserSignal()) {
      this.currentUserSignal.update((user) => {
        if (user) {
          user.gem_balance = newBalance;
        }
        return user;
      });
    }
  }

  getCurrentUser(): Observable<User> {
    return this.profileApi
      .getUser(this.currentUserId())
      .pipe(tap((user) => this.currentUserSignal.set(user)));
  }

  refreshCurrentUser(): Observable<User> {
    return this.getCurrentUser();
  }

  syncUser(user: User): void {
    if (user.id === this.currentUserId()) {
      this.currentUserSignal.set(user);
    }
  }

  getUsers(): Observable<User[]> {
    return this.profileApi.getUsers();
  }

  updateUser(user: User): Observable<User> {
    return this.profileApi.updateUser(user);
  }

  awardQuestRewards(userId: number, gems: number, ecopoints: number, todayDate: string,): Observable<User> {
    return this.profileApi.getUser(userId).pipe(
      switchMap((user) => {
        user.gem_balance += gems;
        user.ecopoints += ecopoints;

        if (user.last_streak_date !== todayDate) {
          user.streak += 1;
          user.last_streak_date = todayDate;
        }

        return this.profileApi.updateUser(user);
      }),
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

  getFamilyUsers(): Observable<FamilyUser[]> {
    return this.profileApi.getFamilyUsers();
  }

  getFamilies(): Observable<Family[]> {
    return this.profileApi.getFamilies();
  }

  updateFamily(family: Family): Observable<Family> {
    return this.profileApi.updateFamily(family);
  }

  createFamily(family: Family): Observable<Family> {
    return this.profileApi.createFamily(family);
  }

  addFamilyMember(familyUser: FamilyUser): Observable<FamilyUser> {
    return this.profileApi.createFamilyUser(familyUser);
  }

  getFriends(): Observable<Friend[]> {
    return this.profileApi.getFriends();
  }

  createFriend(friend: Friend): Observable<Friend> {
    return this.profileApi.createFriend(friend);
  }

  updateFriend(friend: Friend): Observable<Friend> {
    return this.profileApi.updateFriend(friend);
  }

  removeFamilyMember(familyUserId: number): Observable<void> {
    return this.profileApi.deleteFamilyUser(familyUserId);
  }

  getFamilyInvitations(): Observable<FamilyInvitation[]> {
    return this.profileApi.getFamilyInvitations();
  }

  createFamilyInvitation(invitation: FamilyInvitation): Observable<FamilyInvitation> {
    return this.profileApi.createFamilyInvitation(invitation);
  }

  updateFamilyInvitation(invitation: FamilyInvitation): Observable<FamilyInvitation> {
    return this.profileApi.updateFamilyInvitation(invitation);
  }

  removeFriend(friendId: number): Observable<void> {
    return this.profileApi.deleteFriend(friendId);
  }
}
