import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, switchMap } from 'rxjs';
import { CommunityService } from '../../../../community/application/community.service';
import { MonetizationApi } from '../../../../monetization/infrastructure/monetization-api';
import { CosmeticEntity } from '../../../../monetization/domain/cosmetic.entity';
import { UserCosmeticEntity } from '../../../../monetization/domain/user-cosmetic.entity';
import { ProfileService } from '../../../application/profile.service';
import {
  FamilyInvitation,
  FamilyInvitationRole,
} from '../../../domain/model/family-invitation.entity';
import { Family } from '../../../domain/model/family.entity';
import { FamilyUser } from '../../../domain/model/family-user.entity';
import { Friend } from '../../../domain/model/friend.entity';
import { User } from '../../../domain/model/user.entity';
import { QuestsService } from '../../../../quests/application/quests.service';
import { Quest } from '../../../../quests/domain/model/quest.entity';
import { QuestUser } from '../../../../quests/domain/model/quest-user.entity';
import { ProfileCommitmentModal } from '../profile-commitment-modal/profile-commitment-modal';
import {
  FamilyInviteCandidateView,
  FamilyInvitationInboxView,
  FamilyInvitationOutboxView,
  FamilyInvitePayload,
  FamilyMemberView,
  ProfileFamilySection,
} from '../profile-family-section/profile-family-section';
import {
  FriendInviteCandidateView,
  FriendProfileView,
  ProfileFriendsSection,
} from '../profile-friends-section/profile-friends-section';
import { ProfileHero } from '../profile-hero/profile-hero';
import {
  ProfileProgressSection,
  QuestProgressView,
} from '../profile-progress-section/profile-progress-section';
import {
  AchievementView,
  ProfileSummarySection,
} from '../profile-summary-section/profile-summary-section';
import { ProfileTab, ProfileTabs } from '../profile-tabs/profile-tabs';

@Component({
  selector: 'app-profile-content',
  imports: [
    ProfileHero,
    ProfileTabs,
    ProfileSummarySection,
    ProfileFamilySection,
    ProfileProgressSection,
    ProfileFriendsSection,
    ProfileCommitmentModal,
  ],
  templateUrl: './profile-content.html',
  styleUrl: './profile-content.css',
})
export class ProfileContent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly profileService = inject(ProfileService);
  private readonly questsService = inject(QuestsService);
  private readonly communityService = inject(CommunityService);
  private readonly monetizationApi = inject(MonetizationApi);

  readonly currentUser = this.profileService.currentUserProfile;
  readonly activeTab = signal<ProfileTab>('summary');
  readonly selectedFamilyMemberId = signal<number | null>(null);
  readonly selectedFriendId = signal<number | null>(null);
  readonly showCommitmentModal = signal(false);
  readonly commitmentEditorTarget = signal<'user' | 'family'>('user');
  readonly commitmentDraft = signal('');
  readonly savingProfile = signal(false);
  readonly feedbackMessage = signal<string | null>(null);

  private readonly profileLoading = signal(true);
  private readonly profileError = signal<string | null>(null);
  private readonly users = signal<User[]>([]);
  private readonly families = signal<Family[]>([]);
  private readonly familyUsers = signal<FamilyUser[]>([]);
  private readonly familyInvitations = signal<FamilyInvitation[]>([]);
  private readonly friends = signal<Friend[]>([]);
  private readonly cosmetics = signal<CosmeticEntity[]>([]);
  private readonly userCosmetics = signal<UserCosmeticEntity[]>([]);

  readonly loading = computed(
    () =>
      this.profileLoading() || this.questsService.loading() || this.communityService.loading(),
  );
  readonly error = computed(
    () =>
      this.profileError() ?? this.questsService.error() ?? this.communityService.error() ?? null,
  );

  readonly currentUserFamilyMembership = computed(() => {
    const currentUserId = this.currentUser()?.id;
    if (!currentUserId) {
      return null;
    }

    return this.familyUsers().find((membership) => membership.user_id === currentUserId) ?? null;
  });
  readonly primaryFamily = computed(() => {
    const membership = this.currentUserFamilyMembership();
    if (!membership) {
      return null;
    }

    return this.findFamilyById(membership.family_id);
  });
  readonly isCurrentUserAdult = computed(() => this.isAdult(this.currentUser() ?? null));
  readonly canCreateFamily = computed(
    () => this.isCurrentUserAdult() && this.currentUserFamilyMembership() === null,
  );
  readonly canLeaveFamily = computed(() => this.currentUserFamilyMembership() !== null);

  readonly familyMembers = computed<FamilyMemberView[]>(() => {
    const familyId = this.primaryFamily()?.id;
    if (!familyId) {
      return [];
    }

    return this.familyUsers()
      .filter((membership) => membership.family_id === familyId)
      .map((membership) => ({
        membership,
        user: this.users().find((user) => user.id === membership.user_id),
      }))
      .filter(
        (member): member is { membership: FamilyUser; user: User } => Boolean(member.user),
      )
      .map((member) => ({
        ...member,
        ...this.getUserAvatarVisual(member.user.id),
      }))
      .sort((left, right) => {
        const roleOrder =
          this.getRoleOrder(left.membership.family_role) -
          this.getRoleOrder(right.membership.family_role);
        if (roleOrder !== 0) {
          return roleOrder;
        }
        return left.user.name.localeCompare(right.user.name);
      });
  });

  readonly canManageFamily = computed(() => {
    const currentMembership = this.currentUserFamilyMembership();
    if (!currentMembership || !this.isCurrentUserAdult()) {
      return false;
    }
    return true;
  });

  readonly familyInviteCandidates = computed<FamilyInviteCandidateView[]>(() => {
    const currentUserId = this.currentUser()?.id;
    return this.users()
      .filter((user) => user.id !== currentUserId)
      .map((user) => ({
        user,
        disabledReason: this.getFamilyInviteDisabledReason(user.id),
        ...this.getUserAvatarVisual(user.id),
      }))
      .sort((left, right) => left.user.name.localeCompare(right.user.name));
  });

  readonly viewedUser = computed(() => {
    const selectedUserId = this.selectedFriendId() ?? this.selectedFamilyMemberId();
    if (selectedUserId !== null) {
      return this.users().find((user) => user.id === selectedUserId) ?? this.currentUser();
    }

    return this.currentUser();
  });

  readonly viewedMembership = computed(() => {
    const selectedUserId = this.viewedUser()?.id;
    if (!selectedUserId) {
      return null;
    }

    return this.familyMembers().find((member) => member.user.id === selectedUserId) ?? null;
  });

  readonly viewedUserHandle = computed(() => this.buildHandle(this.viewedUser() ?? null));
  readonly viewedFriendCount = computed(() =>
    this.countAcceptedFriends(this.viewedUser()?.id ?? 0),
  );
  readonly viewedUserAvatar = computed(() => this.getUserAvatarVisual(this.viewedUser()?.id));
  readonly currentCommunity = computed(() =>
    this.communityService
      .communities()
      .find((community) => community.id === (this.viewedUser()?.community_id ?? 0)),
  );

  readonly friendProfiles = computed<FriendProfileView[]>(() => {
    const currentUserId = this.currentUser()?.id;
    if (!currentUserId) {
      return [];
    }

    const uniqueRelationships = new Map<number, Friend>();
    this.friends()
      .filter(
        (relationship) =>
          relationship.user_id === currentUserId || relationship.friend_id === currentUserId,
      )
      .forEach((relationship) => {
        const relatedUserId =
          relationship.user_id === currentUserId ? relationship.friend_id : relationship.user_id;

        const existing = uniqueRelationships.get(relatedUserId);
        if (!existing || (existing.status !== 'accepted' && relationship.status === 'accepted')) {
          uniqueRelationships.set(relatedUserId, relationship);
        }
      });

    return Array.from(uniqueRelationships.entries())
      .map(([relatedUserId, relationship]) => {
        const relatedUser = this.users().find((user) => user.id === relatedUserId);
        if (!relatedUser) {
          return null;
        }

        return {
          relationship,
          user: relatedUser,
          statusLabel: this.getFriendStatusLabel(relationship.status),
          mutualCount: this.countMutualFriends(currentUserId, relatedUserId),
          ...this.getUserAvatarVisual(relatedUserId),
        };
      })
      .filter((item): item is FriendProfileView => Boolean(item))
      .sort((left, right) => {
        if (left.relationship.status !== right.relationship.status) {
          return left.relationship.status === 'accepted' ? -1 : 1;
        }
        return right.user.ecopoints - left.user.ecopoints;
      });
  });

  readonly acceptedFriendProfilesCount = computed(
    () => this.friendProfiles().filter((item) => item.relationship.status === 'accepted').length,
  );

  readonly selectedFriendProfile = computed(() => {
    const friendId = this.selectedFriendId();
    if (!friendId) {
      return null;
    }

    const currentUserId = this.currentUser()?.id;
    const relatedUser = this.users().find((user) => user.id === friendId);
    if (!currentUserId || !relatedUser) {
      return null;
    }

    const relationship =
      this.friends()
        .filter(
          (friend) =>
            (friend.user_id === currentUserId && friend.friend_id === friendId) ||
            (friend.user_id === friendId && friend.friend_id === currentUserId),
        )
        .sort((left, right) => {
          if (left.status === right.status) {
            return right.id - left.id;
          }
          return left.status === 'accepted' ? -1 : 1;
        })[0] ?? null;

    if (!relationship) {
      return null;
    }

    return {
      relationship,
      user: relatedUser,
      statusLabel: this.getFriendStatusLabel(relationship.status),
      mutualCount: this.countMutualFriends(currentUserId, friendId),
      ...this.getUserAvatarVisual(friendId),
    };
  });

  readonly friendInviteCandidates = computed<FriendInviteCandidateView[]>(() => {
    const currentUserId = this.currentUser()?.id;
    if (!currentUserId) {
      return [];
    }

    return this.users()
      .filter((user) => user.id !== currentUserId)
      .map((user) => ({
        user,
        disabledReason: this.getFriendInviteDisabledReason(user.id),
        ...this.getUserAvatarVisual(user.id),
      }))
      .sort((left, right) => left.user.name.localeCompare(right.user.name));
  });

  readonly heroRemoveActionLabel = computed(() => {
    if (this.activeTab() === 'friends' && this.selectedFriendId() !== null) {
      return 'Eliminar amigo';
    }

    if (this.activeTab() === 'family' && this.selectedFamilyMemberId() !== null) {
      return 'Eliminar miembro';
    }

    return 'Eliminar';
  });

  readonly selectedFriendAchievements = computed<AchievementView[]>(() => {
    const friendId = this.selectedFriendProfile()?.user.id;
    if (!friendId) {
      return [];
    }

    return this.communityService
      .userAchievements()
      .filter((achievement) => achievement.user_id === friendId)
      .map((userAchievement) => ({
        userAchievement,
        achievement: this.communityService
          .achievements()
          .find((achievement) => achievement.id === userAchievement.achievement_id),
      }))
      .filter((item): item is AchievementView => Boolean(item.achievement))
      .sort(
        (left, right) =>
          new Date(right.userAchievement.date).getTime() -
          new Date(left.userAchievement.date).getTime(),
      );
  });

  readonly viewedAchievements = computed<AchievementView[]>(() => {
    const userId = this.viewedUser()?.id;
    if (!userId) {
      return [];
    }

    return this.communityService
      .userAchievements()
      .filter((achievement) => achievement.user_id === userId)
      .map((userAchievement) => ({
        userAchievement,
        achievement: this.communityService
          .achievements()
          .find((achievement) => achievement.id === userAchievement.achievement_id),
      }))
      .filter((item): item is AchievementView => Boolean(item.achievement))
      .sort(
        (left, right) =>
          new Date(right.userAchievement.date).getTime() -
          new Date(left.userAchievement.date).getTime(),
      );
  });

  readonly pendingQuestProgress = computed(() => this.buildQuestProgressBuckets().pending);
  readonly completedQuestProgress = computed(() => this.buildQuestProgressBuckets().completed);

  readonly incomingInvitations = computed<FamilyInvitationInboxView[]>(() => {
    const currentUserId = this.currentUser()?.id;
    if (!currentUserId) {
      return [];
    }

    return this.familyInvitations()
      .filter(
        (invitation) =>
          invitation.invited_user_id === currentUserId && invitation.status === 'pending',
      )
      .map((invitation) => {
        const inviter = this.users().find((user) => user.id === invitation.inviter_user_id);
        const family = this.findFamilyById(invitation.family_id);
        return {
          id: invitation.id,
          familyName: family?.name ?? `Familia #${invitation.family_id}`,
          inviterName: inviter?.name ?? `Usuario #${invitation.inviter_user_id}`,
          role: invitation.invited_role,
          createdAtLabel: this.formatRelativeDate(invitation.created_at),
        };
      })
      .sort((left, right) => left.createdAtLabel.localeCompare(right.createdAtLabel));
  });

  readonly outgoingInvitations = computed<FamilyInvitationOutboxView[]>(() => {
    const currentUserId = this.currentUser()?.id;
    if (!currentUserId) {
      return [];
    }

    return this.familyInvitations()
      .filter(
        (invitation) =>
          invitation.inviter_user_id === currentUserId && invitation.status === 'pending',
      )
      .map((invitation) => {
        const invitedUser = this.users().find((user) => user.id === invitation.invited_user_id);
        const family = this.findFamilyById(invitation.family_id);
        return {
          id: invitation.id,
          familyName: family?.name ?? `Familia #${invitation.family_id}`,
          invitedName: invitedUser?.name ?? `Usuario #${invitation.invited_user_id}`,
          role: invitation.invited_role,
          createdAtLabel: this.formatRelativeDate(invitation.created_at),
        };
      });
  });

  constructor() {
    this.loadProfileContext();
  }

  selectTab(tab: ProfileTab): void {
    this.activeTab.set(tab);
    if (tab !== 'family') {
      this.selectedFamilyMemberId.set(null);
    }
    if (tab !== 'friends') {
      this.selectedFriendId.set(null);
    }
  }

  openFamilyMember(member: FamilyMemberView): void {
    this.activeTab.set('family');
    this.selectedFamilyMemberId.set(member.user.id);
  }

  closeFamilyMemberProfile(): void {
    this.selectedFamilyMemberId.set(null);
  }

  openFriendProfile(friend: FriendProfileView): void {
    this.selectedFamilyMemberId.set(null);
    this.selectedFriendId.set(friend.user.id);
  }

  closeFriendProfile(): void {
    this.selectedFriendId.set(null);
  }

  handleViewedUserRemoval(): void {
    if (this.activeTab() === 'friends') {
      const selectedFriend = this.selectedFriendProfile();
      if (selectedFriend) {
        this.removeFriend(selectedFriend);
      }
      return;
    }

    this.removeSelectedFamilyMember();
  }

  ignoreEditProfile(): void {}

  openUserCommitmentEditor(): void {
    const userCommitment = this.currentUser()?.commitment ?? '';
    this.commitmentEditorTarget.set('user');
    this.commitmentDraft.set(userCommitment);
    this.showCommitmentModal.set(true);
  }

  openFamilyCommitmentEditor(): void {
    if (!this.canManageFamily()) {
      this.showFeedback('Solo un usuario mayor de edad puede editar el compromiso familiar');
      return;
    }

    this.commitmentEditorTarget.set('family');
    this.commitmentDraft.set(this.primaryFamily()?.commitment ?? '');
    this.showCommitmentModal.set(true);
  }

  closeCommitmentEditor(): void {
    if (this.savingProfile()) {
      return;
    }

    this.showCommitmentModal.set(false);
  }

  updateCommitmentDraft(value: string): void {
    this.commitmentDraft.set(value);
  }

  saveCommitment(): void {
    const nextCommitment = this.commitmentDraft().trim();
    if (this.commitmentEditorTarget() === 'family') {
      this.persistFamilyCommitment(nextCommitment.length > 0 ? nextCommitment : null);
      return;
    }

    this.persistUserCommitment(nextCommitment.length > 0 ? nextCommitment : null);
  }

  clearCommitment(): void {
    if (this.commitmentEditorTarget() === 'family') {
      this.persistFamilyCommitment(null);
      return;
    }

    this.persistUserCommitment(null);
  }

  shareProfile(): void {
    const user = this.viewedUser();
    const currentUser = this.currentUser();
    if (!user || typeof window === 'undefined' || typeof navigator === 'undefined') {
      return;
    }

    const profileUrl = `${window.location.origin}/profile${
      user.id !== currentUser?.id ? `?member=${user.id}` : ''
    }`;

    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(profileUrl)
        .then(() => this.showFeedback('Enlace del perfil copiado'))
        .catch(() => this.showFeedback('No se pudo copiar el enlace del perfil'));
      return;
    }

    this.showFeedback(profileUrl);
  }

  removeSelectedFamilyMember(): void {
    const member = this.viewedMembership();
    const currentUserId = this.currentUser()?.id;
    if (!member || member.user.id === currentUserId) {
      return;
    }

    const shouldRemove =
      typeof window === 'undefined'
        ? true
        : window.confirm(`Quieres eliminar a ${member.user.name} de la familia?`);

    if (!shouldRemove) {
      return;
    }

    this.savingProfile.set(true);
    this.profileService
      .removeFamilyMember(member.membership.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.savingProfile.set(false);
          this.selectedFamilyMemberId.set(null);
          this.showFeedback('Miembro eliminado de la familia');
          this.loadProfileContext();
        },
        error: (error: Error) => {
          this.savingProfile.set(false);
          this.showFeedback(error.message || 'No se pudo eliminar al miembro');
        },
      });
  }

  removeFriend(friend: FriendProfileView): void {
    const currentUserId = this.currentUser()?.id;
    if (!currentUserId) {
      return;
    }

    const shouldRemove =
      typeof window === 'undefined'
        ? true
        : window.confirm(`Quieres eliminar a ${friend.user.name} de tus amigos?`);
    if (!shouldRemove) {
      return;
    }

    const relationsToDelete = this.friends().filter(
      (relationship) =>
        (relationship.user_id === currentUserId && relationship.friend_id === friend.user.id) ||
        (relationship.user_id === friend.user.id && relationship.friend_id === currentUserId),
    );

    if (relationsToDelete.length === 0) {
      this.showFeedback('No se encontro la relacion de amistad para eliminar');
      return;
    }

    this.savingProfile.set(true);
    forkJoin(relationsToDelete.map((relationship) => this.profileService.removeFriend(relationship.id)))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.savingProfile.set(false);
          if (this.selectedFriendId() === friend.user.id) {
            this.selectedFriendId.set(null);
          }
          this.showFeedback('Amigo eliminado');
          this.loadProfileContext();
        },
        error: (error: Error) => {
          this.savingProfile.set(false);
          this.showFeedback(error.message || 'No se pudo eliminar al amigo');
        },
      });
  }

  inviteFamilyMember(payload: FamilyInvitePayload): void {
    if (!this.canManageFamily()) {
      this.showFeedback('Solo un usuario mayor de edad puede invitar miembros a la familia');
      return;
    }
    if (!this.isCurrentUserAdult()) {
      this.showFeedback('Solo un usuario mayor de edad puede enviar invitaciones familiares');
      return;
    }

    const family = this.primaryFamily();
    if (!family) {
      this.showFeedback('No existe una familia activa para enviar invitaciones');
      return;
    }

    const alreadyMember = this.familyMembers().some((member) => member.user.id === payload.userId);
    if (alreadyMember) {
      this.showFeedback('Ese usuario ya forma parte de la familia');
      return;
    }

    const alreadyAssignedToFamily = this.familyUsers().some(
      (membership) => membership.user_id === payload.userId,
    );
    if (alreadyAssignedToFamily) {
      this.showFeedback(
        'No se puede invitar al usuario porque ya tiene una familia asignada',
      );
      return;
    }

    const hasPendingInvitation = this.familyInvitations().some(
      (invitation) =>
        invitation.family_id === family.id &&
        invitation.invited_user_id === payload.userId &&
        invitation.status === 'pending',
    );
    if (hasPendingInvitation) {
      this.showFeedback('Ya existe una invitacion pendiente para ese usuario');
      return;
    }

    const invitation = new FamilyInvitation();
    invitation.family_id = family.id;
    invitation.inviter_user_id = this.currentUser()?.id ?? 0;
    invitation.invited_user_id = payload.userId;
    invitation.invited_role = payload.role;
    invitation.status = 'pending';
    invitation.created_at = new Date().toISOString();
    invitation.responded_at = null;

    this.savingProfile.set(true);
    this.profileService
      .createFamilyInvitation(invitation)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.savingProfile.set(false);
          this.showFeedback('Invitacion enviada correctamente');
          this.loadProfileContext();
        },
        error: (error: Error) => {
          this.savingProfile.set(false);
          this.showFeedback(error.message || 'No se pudo enviar la invitacion');
        },
      });
  }

  sendFriendRequest(userId: number): void {
    const currentUserId = this.currentUser()?.id;
    if (!currentUserId) {
      return;
    }

    if (userId === currentUserId) {
      this.showFeedback('No puedes enviarte una solicitud de amistad a ti mismo');
      return;
    }

    const disabledReason = this.getFriendInviteDisabledReason(userId);
    if (disabledReason) {
      this.showFeedback(disabledReason);
      return;
    }

    const request = new Friend();
    request.user_id = currentUserId;
    request.friend_id = userId;
    request.status = 'pending';

    this.savingProfile.set(true);
    this.profileService
      .createFriend(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.savingProfile.set(false);
          this.showFeedback('Solicitud de amistad enviada');
          this.loadProfileContext();
        },
        error: (error: Error) => {
          this.savingProfile.set(false);
          this.showFeedback(error.message || 'No se pudo enviar la solicitud de amistad');
        },
      });
  }

  createFamily(familyName: string): void {
    if (!this.isCurrentUserAdult()) {
      this.showFeedback('Solo un usuario mayor de edad puede crear una familia');
      return;
    }
    if (this.primaryFamily()) {
      this.showFeedback('Ya perteneces a una familia. Debes salir primero.');
      return;
    }

    const newFamily = new Family();
    newFamily.name = familyName.trim();
    newFamily.commitment = null;
    if (!newFamily.name) {
      this.showFeedback('Debes ingresar un nombre de familia');
      return;
    }

    this.savingProfile.set(true);
    this.profileService
      .createFamily(newFamily)
      .pipe(
        switchMap((createdFamily) => {
          const familyUser = new FamilyUser();
          familyUser.user_id = this.currentUser()?.id ?? 0;
          familyUser.family_id = createdFamily.id;
          familyUser.family_role = 'parent';
          familyUser.joined_at = new Date().toISOString().slice(0, 10);
          return this.profileService.addFamilyMember(familyUser);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.savingProfile.set(false);
          this.showFeedback('Familia creada correctamente');
          this.loadProfileContext();
        },
        error: (error: Error) => {
          this.savingProfile.set(false);
          this.showFeedback(error.message || 'No se pudo crear la familia');
        },
      });
  }

  acceptFamilyInvitation(invitationId: number): void {
    const invitation = this.familyInvitations().find((item) => item.id === invitationId);
    const currentUser = this.currentUser();
    if (!invitation || !currentUser) {
      return;
    }
    if (invitation.status !== 'pending') {
      this.showFeedback('La invitacion ya no esta disponible');
      return;
    }
    if (invitation.invited_user_id !== currentUser.id) {
      this.showFeedback('No puedes responder una invitacion de otro usuario');
      return;
    }
    if (this.currentUserFamilyMembership()) {
      this.showFeedback('Ya perteneces a una familia. Debes salir primero para aceptar otra.');
      return;
    }

    const inviter = this.users().find((user) => user.id === invitation.inviter_user_id) ?? null;
    if (!this.isAdult(inviter)) {
      this.showFeedback('La invitacion no es valida porque el emisor no es mayor de edad');
      return;
    }

    const acceptedRole: FamilyInvitationRole =
      this.isAdult(currentUser) && invitation.invited_role === 'parent' ? 'parent' : 'child';

    const membership = new FamilyUser();
    membership.user_id = currentUser.id;
    membership.family_id = invitation.family_id;
    membership.family_role = acceptedRole;
    membership.joined_at = new Date().toISOString().slice(0, 10);

    const updatedInvitation = new FamilyInvitation();
    Object.assign(updatedInvitation, invitation);
    updatedInvitation.status = 'accepted';
    updatedInvitation.responded_at = new Date().toISOString();

    this.savingProfile.set(true);
    this.profileService
      .addFamilyMember(membership)
      .pipe(
        switchMap(() => this.profileService.updateFamilyInvitation(updatedInvitation)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.savingProfile.set(false);
          this.showFeedback('Te uniste a la familia correctamente');
          this.loadProfileContext();
        },
        error: (error: Error) => {
          this.savingProfile.set(false);
          this.showFeedback(error.message || 'No se pudo aceptar la invitacion');
        },
      });
  }

  rejectFamilyInvitation(invitationId: number): void {
    const invitation = this.familyInvitations().find((item) => item.id === invitationId);
    const currentUser = this.currentUser();
    if (!invitation || !currentUser || invitation.invited_user_id !== currentUser.id) {
      return;
    }
    if (invitation.status !== 'pending') {
      this.showFeedback('La invitacion ya no esta disponible');
      return;
    }

    const updatedInvitation = new FamilyInvitation();
    Object.assign(updatedInvitation, invitation);
    updatedInvitation.status = 'rejected';
    updatedInvitation.responded_at = new Date().toISOString();

    this.savingProfile.set(true);
    this.profileService
      .updateFamilyInvitation(updatedInvitation)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.savingProfile.set(false);
          this.showFeedback('Invitacion rechazada');
          this.loadProfileContext();
        },
        error: (error: Error) => {
          this.savingProfile.set(false);
          this.showFeedback(error.message || 'No se pudo rechazar la invitacion');
        },
      });
  }

  leaveCurrentFamily(): void {
    const currentMembership = this.currentUserFamilyMembership();
    if (!currentMembership) {
      this.showFeedback('No estas inscrito o incluido en una familia.');
      return;
    }

    const shouldLeave =
      typeof window === 'undefined'
        ? true
        : window.confirm('Quieres salir de tu familia actual?');
    if (!shouldLeave) {
      return;
    }

    this.savingProfile.set(true);
    this.profileService
      .removeFamilyMember(currentMembership.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.savingProfile.set(false);
          this.selectedFamilyMemberId.set(null);
          this.showFeedback('Saliste de la familia actual');
          this.loadProfileContext();
        },
        error: (error: Error) => {
          this.savingProfile.set(false);
          this.showFeedback(error.message || 'No se pudo salir de la familia');
        },
      });
  }

  isViewingOwnProfile(): boolean {
    return this.viewedUser()?.id === this.currentUser()?.id;
  }

  getCommitmentTitle(): string {
    return this.isViewingOwnProfile()
      ? 'Mi compromiso'
      : `Compromiso de ${this.getFirstName(this.viewedUser()?.name ?? '')}`;
  }

  getCommitmentDateLabel(): string {
    const user = this.viewedUser();
    if (!user) {
      return '';
    }

    return `Actualizado ${this.formatRelativeDate(user.registered_at)}`;
  }

  getFriendCommitmentDateLabel(user: User): string {
    return `Actualizado ${this.formatRelativeDate(user.registered_at)}`;
  }

  getFamilySummary(): string {
    const family = this.primaryFamily();
    if (!family) {
      return 'No estas inscrito o incluido en una familia.';
    }

    const community = this.communityService
      .communities()
      .find((item) => item.id === (this.currentUser()?.community_id ?? 0));
    const memberCount = this.familyMembers().length;
    const earliestJoinDate = this.familyMembers()
      .map((member) => member.membership.joined_at)
      .sort()[0];

    return `${community?.name ?? family.name} · ${memberCount} miembros · Vinculada ${this.formatRelativeDate(earliestJoinDate)}`;
  }

  getRoleLabel(role: string): string {
    const normalizedRole = this.normalizeFamilyRole(role);
    if (normalizedRole === 'parent') {
      return 'Padre/Madre';
    }
    if (normalizedRole === 'child') {
      return 'Hijo/Hija';
    }
    return role;
  }

  getViewedMembershipCaption(): string {
    const joinedAt = this.viewedMembership()?.membership.joined_at;
    if (!joinedAt) {
      return 'Sin fecha de ingreso';
    }

    return `Se unio ${this.formatRelativeDate(joinedAt)}`;
  }

  private loadProfileContext(): void {
    this.profileLoading.set(true);
    this.profileError.set(null);

    forkJoin({
      currentUser: this.profileService.refreshCurrentUser(),
      users: this.profileService.getUsers(),
      families: this.profileService.getFamilies(),
      familyUsers: this.profileService.getFamilyUsers(),
      familyInvitations: this.profileService.getFamilyInvitations(),
      friends: this.profileService.getFriends(),
      cosmetics: this.monetizationApi.getCosmetics(),
      userCosmetics: this.monetizationApi.getUserCosmetics(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({
          users,
          families,
          familyUsers,
          familyInvitations,
          friends,
          cosmetics,
          userCosmetics,
        }) => {
          this.users.set(users);
          this.families.set(families);
          this.familyUsers.set(familyUsers);
          this.familyInvitations.set(familyInvitations);
          this.friends.set(friends);
          this.cosmetics.set(cosmetics);
          this.userCosmetics.set(userCosmetics);
          this.profileLoading.set(false);
        },
        error: (error: Error) => {
          this.profileError.set(error.message || 'No se pudo cargar el perfil');
          this.profileLoading.set(false);
        },
      });
  }

  private persistUserCommitment(commitment: string | null): void {
    const currentUser = this.currentUser();
    if (!currentUser) {
      return;
    }

    const updatedUser = new User();
    Object.assign(updatedUser, currentUser);
    updatedUser.commitment = commitment;

    this.savingProfile.set(true);
    this.profileService
      .updateUser(updatedUser)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.profileService.syncUser(user);
          this.savingProfile.set(false);
          this.showCommitmentModal.set(false);
          this.showFeedback(
            user.commitment ? 'Compromiso guardado correctamente' : 'Compromiso eliminado',
          );
        },
        error: (error: Error) => {
          this.savingProfile.set(false);
          this.showFeedback(error.message || 'No se pudo actualizar el compromiso');
        },
      });
  }

  private persistFamilyCommitment(commitment: string | null): void {
    const family = this.primaryFamily();
    if (!family) {
      this.showFeedback('No se encontro una familia para actualizar el compromiso');
      return;
    }

    const updatedFamily = new Family();
    Object.assign(updatedFamily, family);
    updatedFamily.commitment = commitment;

    this.savingProfile.set(true);
    this.profileService
      .updateFamily(updatedFamily)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (savedFamily) => {
          this.families.update((families) =>
            families.map((item) => (item.id === savedFamily.id ? savedFamily : item)),
          );
          this.savingProfile.set(false);
          this.showCommitmentModal.set(false);
          this.showFeedback(
            savedFamily.commitment
              ? 'Compromiso familiar guardado correctamente'
              : 'Compromiso familiar eliminado',
          );
        },
        error: (error: Error) => {
          this.savingProfile.set(false);
          this.showFeedback(error.message || 'No se pudo actualizar el compromiso familiar');
        },
      });
  }

  private showFeedback(message: string): void {
    this.feedbackMessage.set(message);
    globalThis.setTimeout(() => {
      if (this.feedbackMessage() === message) {
        this.feedbackMessage.set(null);
      }
    }, 2600);
  }

  private countAcceptedFriends(userId: number): number {
    return userId ? this.getAcceptedFriendIds(userId).size : 0;
  }

  private buildHandle(user: User | null): string {
    if (!user) {
      return '@ecomind';
    }

    const localPart = user.email.split('@')[0]?.trim().toLowerCase();
    if (localPart) {
      return `@${localPart}`;
    }

    return `@${user.name.replace(/\s+/g, '').toLowerCase()}`;
  }

  private buildQuestProgressBuckets(): {
    pending: QuestProgressView[];
    completed: QuestProgressView[];
  } {
    const currentUserId = this.currentUser()?.id;
    if (!currentUserId) {
      return { pending: [], completed: [] };
    }

    const latestRecords = this.getLatestQuestRecords(currentUserId);
    const completed: QuestProgressView[] = [];
    const pending: QuestProgressView[] = [];

    this.questsService.quests().forEach((quest) => {
      const record = latestRecords.get(quest.id);
      const activityCount = this.questsService
        .activities()
        .filter((activity) => activity.quest_id === quest.id).length;

      if (record?.status === 'completed') {
        completed.push({
          quest,
          progress: 100,
          status: 'completed',
          dateLabel: record.end_date
            ? `Completado ${this.formatRelativeDate(record.end_date)}`
            : 'Completado',
          activityCount,
        });
        return;
      }

      if (record?.status !== 'in_progress') {
        return;
      }

      if (this.isQuestExpired(quest)) {
        return;
      }

      pending.push({
        quest,
        progress: record.progress ?? 0,
        status: 'in_progress',
        dateLabel: record.start_date
          ? `Iniciado ${this.formatRelativeDate(record.start_date)}`
          : 'En progreso',
        activityCount,
      });
    });

    return {
      pending: pending.sort((left, right) => {
        if (right.progress !== left.progress) {
          return right.progress - left.progress;
        }
        return left.quest.title.localeCompare(right.quest.title);
      }),
      completed: completed.sort(
        (left, right) =>
          this.getQuestCompletionTime(right.quest.id, currentUserId) -
          this.getQuestCompletionTime(left.quest.id, currentUserId),
      ),
    };
  }

  private getLatestQuestRecords(userId: number): Map<number, QuestUser> {
    return this.questsService
      .questsUser()
      .filter((record) => record.user_id === userId)
      .sort((left, right) => right.id - left.id)
      .reduce((records, record) => {
        if (!records.has(record.quest_id)) {
          records.set(record.quest_id, record);
        }
        return records;
      }, new Map<number, QuestUser>());
  }

  private getQuestCompletionTime(questId: number, userId: number): number {
    return (
      this.questsService
        .questsUser()
        .filter((record) => record.user_id === userId && record.quest_id === questId)
        .map((record) => new Date(record.end_date ?? record.start_date).getTime())
        .sort((left, right) => right - left)[0] ?? 0
    );
  }

  private isQuestExpired(quest: Quest): boolean {
    return quest.expiration_date ? new Date(quest.expiration_date).getTime() < Date.now() : false;
  }

  private getRoleOrder(role: string): number {
    const normalizedRole = this.normalizeFamilyRole(role);
    if (normalizedRole === 'parent') {
      return 0;
    }
    if (normalizedRole === 'child') {
      return 1;
    }
    return 2;
  }

  private formatRelativeDate(dateValue: string | null | undefined): string {
    if (!dateValue) {
      return 'hace poco';
    }

    const now = new Date();
    const targetDate = new Date(dateValue);
    const diffInDays = Math.max(
      0,
      Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24)),
    );

    if (diffInDays === 0) {
      return 'hoy';
    }
    if (diffInDays === 1) {
      return 'hace 1 dia';
    }
    if (diffInDays < 30) {
      return `hace ${diffInDays} dias`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths === 1) {
      return 'hace 1 mes';
    }

    return `hace ${diffInMonths} meses`;
  }

  private normalizeFamilyRole(role: string | null | undefined): 'parent' | 'child' | 'unknown' {
    const normalizedRole = (role ?? '').trim().toLowerCase();
    if (
      normalizedRole === 'parent' ||
      normalizedRole === 'padre' ||
      normalizedRole === 'madre' ||
      normalizedRole === 'padre/madre'
    ) {
      return 'parent';
    }
    if (
      normalizedRole === 'child' ||
      normalizedRole === 'hijo' ||
      normalizedRole === 'hija' ||
      normalizedRole === 'hijo/hija'
    ) {
      return 'child';
    }
    return 'unknown';
  }

  private isAdult(user: User | null): boolean {
    if (!user?.birth_date) {
      return false;
    }

    const birthDate = new Date(user.birth_date);
    if (Number.isNaN(birthDate.getTime())) {
      return false;
    }

    const now = new Date();
    let age = now.getFullYear() - birthDate.getFullYear();
    const monthDiff = now.getMonth() - birthDate.getMonth();
    const dayDiff = now.getDate() - birthDate.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age -= 1;
    }

    return age >= 18;
  }

  private findFamilyById(familyId: number): Family | null {
    return this.families().find((family) => family.id === familyId) ?? null;
  }

  private getFirstName(name: string): string {
    return name.split(' ').filter(Boolean)[0] ?? name;
  }

  private getFriendStatusLabel(status: string): string {
    if (status === 'accepted') {
      return 'Amigos';
    }
    if (status === 'pending') {
      return 'Solicitud pendiente';
    }

    return status;
  }

  private countMutualFriends(sourceUserId: number, targetUserId: number): number {
    const sourceConnections = this.getAcceptedFriendIds(sourceUserId);
    const targetConnections = this.getAcceptedFriendIds(targetUserId);
    sourceConnections.delete(targetUserId);
    targetConnections.delete(sourceUserId);

    let mutualCount = 0;
    sourceConnections.forEach((connectionId) => {
      if (targetConnections.has(connectionId)) {
        mutualCount += 1;
      }
    });

    return mutualCount;
  }

  private getAcceptedFriendIds(userId: number): Set<number> {
    const acceptedFriendIds = new Set<number>();
    this.friends()
      .filter((friend) => friend.status === 'accepted')
      .forEach((friend) => {
        if (friend.user_id === userId) {
          acceptedFriendIds.add(friend.friend_id);
        }
        if (friend.friend_id === userId) {
          acceptedFriendIds.add(friend.user_id);
        }
      });

    return acceptedFriendIds;
  }

  private getUserAvatarVisual(userId: number | null | undefined): {
    equippedAvatarUrl: string | null;
    equippedOverlayUrl: string | null;
    equippedOverlayType: string | null;
  } {
    if (!userId) {
      return {
        equippedAvatarUrl: null,
        equippedOverlayUrl: null,
        equippedOverlayType: null,
      };
    }

    const cosmeticsById = new Map(this.cosmetics().map((cosmetic) => [cosmetic.id, cosmetic]));
    const equippedItems = this.userCosmetics().filter(
      (userCosmetic) => userCosmetic.userId === userId && userCosmetic.equipped,
    );

    const avatarCosmetic = equippedItems
      .map((userCosmetic) => cosmeticsById.get(userCosmetic.cosmeticId))
      .find((cosmetic) => cosmetic?.type === 'avatar');
    const overlayCosmetic = equippedItems
      .map((userCosmetic) => cosmeticsById.get(userCosmetic.cosmeticId))
      .find((cosmetic) => cosmetic && cosmetic.type !== 'avatar');

    return {
      equippedAvatarUrl: avatarCosmetic?.imageUrl ?? null,
      equippedOverlayUrl: overlayCosmetic?.imageUrl ?? null,
      equippedOverlayType: overlayCosmetic?.type ?? null,
    };
  }

  private getFamilyInviteDisabledReason(userId: number): string | null {
    const familyId = this.primaryFamily()?.id;
    if (!familyId) {
      return 'No tienes una familia activa para invitar';
    }

    const isCurrentFamilyMember = this.familyUsers().some(
      (membership) => membership.family_id === familyId && membership.user_id === userId,
    );
    if (isCurrentFamilyMember) {
      return 'Ese usuario ya forma parte de la familia';
    }

    const alreadyAssignedToFamily = this.familyUsers().some(
      (membership) => membership.user_id === userId,
    );
    if (alreadyAssignedToFamily) {
      return 'Ya tiene una familia asignada';
    }

    const hasPendingInvitation = this.familyInvitations().some(
      (invitation) =>
        invitation.family_id === familyId &&
        invitation.invited_user_id === userId &&
        invitation.status === 'pending',
    );
    if (hasPendingInvitation) {
      return 'Ya existe una invitacion pendiente';
    }

    return null;
  }

  private getFriendInviteDisabledReason(userId: number): string | null {
    const currentUserId = this.currentUser()?.id;
    if (!currentUserId) {
      return 'No se pudo identificar al usuario actual';
    }

    const relationships = this.friends().filter(
      (friend) =>
        (friend.user_id === currentUserId && friend.friend_id === userId) ||
        (friend.user_id === userId && friend.friend_id === currentUserId),
    );

    if (relationships.length === 0) {
      return null;
    }

    if (relationships.some((relationship) => relationship.status === 'accepted')) {
      return 'Ya son amigos';
    }

    if (relationships.some((relationship) => relationship.status === 'pending')) {
      return 'Ya existe una solicitud de amistad pendiente';
    }

    return 'No se puede enviar la solicitud de amistad';
  }
}

