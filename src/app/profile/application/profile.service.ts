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

  getUser(userId: number): Observable<User> {
    return this.profileApi.getUser(userId);
  }

  getUsers(): Observable<User[]> {
    return this.profileApi.getUsers();
  }

  updateUser(user: User): Observable<User> {
    return this.profileApi.updateUser(user);
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

  getCurrentUserFamilyUsers(): Observable<FamilyUser[]> {
    return this.profileApi.getFamilyUsersByUserId(this.currentUserId());
  }

  getFamilyUsers(): Observable<FamilyUser[]> {
    return this.profileApi.getFamilyUsers();
  }

  getFamilyUsersByFamilyId(familyId: number): Observable<FamilyUser[]> {
    return this.getFamilyUsers().pipe(
      map((familyUsers) => familyUsers.filter((familyUser) => familyUser.family_id === familyId)),
    );
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

  getFamilies(): Observable<Family[]> {
    return this.profileApi.getFamilies();
  }

  getCurrentUserFriends(): Observable<Friend[]> {
    return this.profileApi.getFriendsByUserId(this.currentUserId());
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
