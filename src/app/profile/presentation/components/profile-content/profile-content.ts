import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { CommunityService } from '../../../../community/application/community.service';
import { ProfileService } from '../../../application/profile.service';
import { Family } from '../../../domain/model/family.entity';
import { FamilyUser } from '../../../domain/model/family-user.entity';
import { Friend } from '../../../domain/model/friend.entity';
import { User } from '../../../domain/model/user.entity';
import { QuestsService } from '../../../../quests/application/quests.service';
import { Quest } from '../../../../quests/domain/model/quest.entity';
import { QuestUser } from '../../../../quests/domain/model/quest-user.entity';
import { ProfileCommitmentModal } from '../profile-commitment-modal/profile-commitment-modal';
import {
  FavoriteItemView,
  ProfileFavoritesSection,
} from '../profile-favorites-section/profile-favorites-section';
import {
  FamilyInvitePayload,
  FamilyMemberView,
  ProfileFamilySection,
} from '../profile-family-section/profile-family-section';
import {
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
    ProfileFavoritesSection,
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
  private readonly friends = signal<Friend[]>([]);

  readonly loading = computed(
    () =>
      this.profileLoading() || this.questsService.loading() || this.communityService.loading(),
  );
  readonly error = computed(
    () =>
      this.profileError() ?? this.questsService.error() ?? this.communityService.error() ?? null,
  );

  readonly primaryFamily = computed(() => this.families()[0] ?? null);

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
      .filter((member): member is FamilyMemberView => Boolean(member.user))
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
    const currentUserId = this.currentUser()?.id;
    if (!currentUserId) {
      return false;
    }

    const currentMembership = this.familyMembers().find(
      (member) => member.user.id === currentUserId,
    );
    return currentMembership?.membership.family_role === 'parent';
  });

  readonly familyInviteCandidates = computed(() => {
    const memberIds = new Set(this.familyMembers().map((member) => member.user.id));
    return this.users()
      .filter((user) => !memberIds.has(user.id))
      .sort((left, right) => left.name.localeCompare(right.name));
  });

  readonly viewedUser = computed(() => {
    const selectedUserId = this.selectedFamilyMemberId();
    if (selectedUserId !== null) {
      return (
        this.familyMembers().find((member) => member.user.id === selectedUserId)?.user ??
        this.currentUser()
      );
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
  readonly currentCommunity = computed(() =>
    this.communityService
      .communities()
      .find((community) => community.id === (this.viewedUser()?.community_id ?? 0)),
  );

  readonly friendProfiles = computed<FriendProfileView[]>(() => {
    const viewedUserId = this.viewedUser()?.id;
    if (!viewedUserId) {
      return [];
    }

    const uniqueRelationships = new Map<number, Friend>();
    this.friends()
      .filter(
        (relationship) =>
          relationship.user_id === viewedUserId || relationship.friend_id === viewedUserId,
      )
      .forEach((relationship) => {
        const relatedUserId =
          relationship.user_id === viewedUserId ? relationship.friend_id : relationship.user_id;

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
          mutualCount: this.countMutualFriends(viewedUserId, relatedUserId),
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

    return this.friendProfiles().find((friend) => friend.user.id === friendId) ?? null;
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

  readonly favoriteItems = computed<FavoriteItemView[]>(() => {
    const currentUserId = this.currentUser()?.id;
    if (!currentUserId) {
      return [];
    }

    const eventItems = this.communityService
      .events()
      .filter((event) => event.author_id === currentUserId)
      .map<FavoriteItemView>((event) => ({
        id: `event-${event.id}`,
        category: 'event',
        title: event.name,
        description: event.description,
        imageUrl: event.image_url,
        eyebrow: 'Evento',
        meta: this.formatAbsoluteDate(event.date),
      }));

    const postItems = this.communityService
      .posts()
      .filter((post) => post.user_id === currentUserId)
      .map<FavoriteItemView>((post) => ({
        id: `post-${post.id}`,
        category: 'post',
        title: 'Publicacion destacada',
        description: post.content,
        imageUrl: post.image_url,
        eyebrow: 'Comunidad',
        meta: `${post.likes} likes · ${post.points} puntos`,
      }));

    const latestRecords = this.getLatestQuestRecords(currentUserId);
    const questItems = this.questsService
      .quests()
      .filter((quest) => latestRecords.has(quest.id))
      .map<FavoriteItemView>((quest) => ({
        id: `quest-${quest.id}`,
        category: 'quest',
        title: quest.title,
        description: quest.description,
        imageUrl: quest.image_url,
        eyebrow: this.formatQuestCategory(quest.category),
        meta: `${quest.reward_ecopoints} ecoPoints · ${quest.time} min`,
      }));

    return [...eventItems, ...postItems, ...questItems].sort((left, right) =>
      left.category.localeCompare(right.category),
    );
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

  ignoreEditProfile(): void {}

  openUserCommitmentEditor(): void {
    const userCommitment = this.currentUser()?.commitment ?? '';
    this.commitmentEditorTarget.set('user');
    this.commitmentDraft.set(userCommitment);
    this.showCommitmentModal.set(true);
  }

  openFamilyCommitmentEditor(): void {
    if (!this.canManageFamily()) {
      this.showFeedback('Solo Padre/Madre puede editar el compromiso de la familia');
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
      this.showFeedback('Solo Padre/Madre puede invitar miembros a la familia');
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

    const familyUser = new FamilyUser();
    familyUser.user_id = payload.userId;
    familyUser.family_id = family.id;
    familyUser.family_role = payload.role;
    familyUser.joined_at = new Date().toISOString().slice(0, 10);

    this.savingProfile.set(true);
    this.profileService
      .addFamilyMember(familyUser)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.savingProfile.set(false);
          this.showFeedback('Miembro agregado a la familia');
          this.loadProfileContext();
        },
        error: (error: Error) => {
          this.savingProfile.set(false);
          this.showFeedback(error.message || 'No se pudo agregar el miembro a la familia');
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
      return 'Aun no tienes una familia registrada.';
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
    const roleMap: Record<string, string> = {
      parent: 'Padre/Madre',
      child: 'Hijo/Hija',
    };

    return roleMap[role] ?? role;
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
      families: this.profileService.getCurrentUserFamilies(),
      familyUsers: this.profileService.getFamilyUsers(),
      friends: this.profileService.getFriends(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ users, families, familyUsers, friends }) => {
          const familyIds = new Set(families.map((family) => family.id));

          this.users.set(users);
          this.families.set(families);
          this.familyUsers.set(
            familyUsers.filter((membership) => familyIds.has(membership.family_id)),
          );
          this.friends.set(friends);
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

      if (this.isQuestExpired(quest)) {
        return;
      }

      pending.push({
        quest,
        progress: record?.progress ?? 0,
        status: record ? 'in_progress' : 'pending',
        dateLabel: record?.start_date
          ? `Iniciado ${this.formatRelativeDate(record.start_date)}`
          : 'Aun no iniciado',
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
    if (role === 'parent') {
      return 0;
    }
    if (role === 'child') {
      return 1;
    }
    return 2;
  }

  private formatQuestCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      energy: 'Energia',
      water: 'Agua',
      recycle: 'Reciclaje',
      daily_quest: 'Reto diario',
    };

    return categoryMap[category] ?? category;
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

  private formatAbsoluteDate(dateValue: string): string {
    return new Intl.DateTimeFormat('es-PE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateValue));
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
}
