import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs';
import { QuestsService } from '../../../application/quests.service';
import { MonetizationStoreService } from '../../../../monetization/application/monetization-store.service';
import { QuestProgressService } from '../../../application/quest-progress.service';
import { CollaborativeQuestsService } from '../../../application/collaborative-quests.service';

@Component({
  selector: 'app-quest-detail-content',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './quest-detail-content.html',
  styleUrl: './quest-detail-content.css',
})
export class QuestDetailContent {
  private readonly questsService = inject(QuestsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly monetizationSvc = inject(MonetizationStoreService);
  private readonly questProgressService = inject(QuestProgressService);
  private readonly collaborativeQuestsService = inject(CollaborativeQuestsService);

  readonly questId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('questId')))),
    { initialValue: Number(this.route.snapshot.paramMap.get('questId')) },
  );
  readonly backUrl = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('returnUrl') || '/quests')),
    { initialValue: this.route.snapshot.queryParamMap.get('returnUrl') || '/quests' },
  );
  readonly detail = computed(() => {
    const id = this.questId();
    const quest = Number.isFinite(id) ? this.questsService.getQuestById(id)() : undefined;
    if (!quest) return undefined;

    return {
      quest,
      minigame: quest.minigame_id
        ? this.questsService.minigames().find((minigame) => minigame.id === quest.minigame_id)
        : undefined,
      latestMinigameAttempt: this.questsService
        .minigameAttempts()
        .filter(
          (attempt) =>
            attempt.quest_id === quest.id && attempt.user_id === this.questsService.currentUserId(),
        )
        .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())[0],
      started: quest.started,
      completed: quest.completed,
    };
  });
  readonly collaborativeContext = computed(() => {
    const detail = this.detail();
    if (!detail || !['COLLABORATIVE', 'FAMILY'].includes(detail.quest.type)) {
      return undefined;
    }
    return this.buildCollaborativeContext(detail.quest.id);
  });
  private readonly collaborativeStateLoader = effect(() => {
    const detail = this.detail();
    if (detail && ['COLLABORATIVE', 'FAMILY'].includes(detail.quest.type)) {
      this.collaborativeQuestsService.refreshState(detail.quest.id);
    }
  });

  readonly actionLabel = computed(() => {
    const detail = this.detail();
    if (!detail) return this.translate.instant('quests.actions.startActivity');

    if (detail.quest.type === 'MINIGAME') {
      return this.translate.instant(
        detail.latestMinigameAttempt ? 'quests.actions.playAgain' : 'quests.actions.play',
      );
    }

    if (detail.completed) {
      return this.translate.instant('quests.actions.startAgain');
    }

    return this.translate.instant(
      detail.started ? 'quests.actions.viewActivity' : 'quests.actions.startActivity',
    );
  });

  readonly showPrimaryAction = computed(() => {
    const detail = this.detail();
    const context = this.collaborativeContext();
    if (detail?.quest.type === 'FAMILY' && !detail.started) {
      return false;
    }
    return !['COLLABORATIVE', 'FAMILY'].includes(detail?.quest.type ?? '') || !context?.pendingInvitation;
  });

  readonly primaryActionDisabled = computed(() => {
    const detail = this.detail();
    const context = this.collaborativeContext();
    if (!detail) {
      return false;
    }
    return Boolean(
      ['COLLABORATIVE', 'FAMILY'].includes(detail?.quest.type ?? '') &&
      !detail.started &&
      !context?.canStart,
    );
  });

  startQuest(): void {
    const detail = this.detail();
    if (!detail) return;
    if (this.primaryActionDisabled()) return;

    if (detail.quest.type === 'MINIGAME') {
      if (detail.minigame?.url) {
        window.location.href = this.buildMinigameUrl(detail.minigame.url, detail.quest.id);
      }
      return;
    }

    if (['COLLABORATIVE', 'FAMILY'].includes(detail.quest.type)) {
      if (detail.quest.type === 'FAMILY' && !detail.started) {
        return;
      }
      if (!detail.started) {
        const context = this.collaborativeContext();
        if (context?.session?.status === 'PENDING') {
          this.questProgressService.addCollaborativeQuestProgress(detail.quest.id);
          void this.router.navigate(['/quests', detail.quest.id, 'started']);
          return;
        }

        this.questProgressService.addQuestProgress(detail.quest.id).subscribe({
          next: () => void this.router.navigate(['/quests', detail.quest.id, 'started']),
        });
        return;
      }

      void this.router.navigate(['/quests', detail.quest.id, 'activities']);
      return;
    }

    if (!detail.started) {
      this.questProgressService.addQuestProgress(detail.quest.id).subscribe({
        next: () => void this.router.navigate(['/quests', detail.quest.id, 'started']),
      });
      return;
    }

    void this.router.navigate(['/quests', detail.quest.id, 'activities']);
  }

  formatCategory(category: string): string {
    const key = `quests.categories.${category.toLowerCase()}`;
    const translated = this.translate.instant(key);
    return translated === key ? category.toLowerCase().replaceAll('_', ' ') : translated;
  }

  inviteFriend(friendUserId: number | undefined): void {
    const detail = this.detail();
    if (!detail || friendUserId === undefined) return;

    this.collaborativeQuestsService.addInvitation(detail.quest.id, friendUserId);
  }

  acceptInvitation(memberId: number): void {
    this.collaborativeQuestsService.acceptInvitation(memberId);
  }

  declineInvitation(memberId: number): void {
    this.collaborativeQuestsService.declineInvitation(memberId);
  }

  leaveQuest(memberId: number): void {
    this.collaborativeQuestsService.leaveQuest(memberId);
  }

  deleteSession(sessionId: number | undefined): void {
    if (sessionId === undefined) return;
    this.collaborativeQuestsService.deletePendingSession(sessionId);
  }

  removeMember(memberId: number): void {
    this.collaborativeQuestsService.removeMember(memberId);
  }

  getUserInitials(name: string | undefined): string {
    if (!name) return '?';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  getEquippedAvatarUrl(userId: number | undefined): string | null {
    if (!userId) return null;
    return this.monetizationSvc.getEquippedAvatarUrlForUser(userId);
  }

  getEquippedOverlayUrl(userId: number | undefined): string | null {
    if (!userId) return null;
    return this.monetizationSvc.getEquippedOverlayUrlForUser(userId);
  }

  getEquippedOverlayType(userId: number | undefined): string | null {
    if (!userId) return null;
    return this.monetizationSvc.getEquippedOverlayTypeForUser(userId);
  }

  getAvatarHue(userId: number | undefined): string {
    const safeId = userId ?? 1;
    return `${(safeId * 67) % 360}`;
  }

  private buildCollaborativeContext(questId: number) {
    const state = this.questsService.collaborativeStates()[questId];
    const session =
      state?.session && state.session.status !== 'COMPLETED' ? state.session : undefined;
    const members = session ? state?.members ?? [] : [];
    const currentMember = session ? state?.currentMember ?? undefined : undefined;
    const pendingInvitation = session ? state?.pendingInvitation ?? undefined : undefined;
    const participants = this.buildParticipants(members);
    const inviteOptions = this.buildInviteOptions(
      questId,
      session?.id,
      members,
      state?.unavailableUserIds ?? [],
    );
    const isOwner = Boolean(session && session.owner_user_id === this.questsService.currentUserId());
    const isAcceptedParticipant = currentMember?.status === 'ACCEPTED';
    const permissions = state?.permissions;
    const hasActiveQuest = Boolean(this.questsService.findLatestCurrentUserActiveQuest(questId));
    const fallbackCanInvite =
      !hasActiveQuest && (!session || (isOwner && session.status === 'PENDING'));

    return {
      session,
      currentMember,
      pendingInvitation,
      participants,
      inviteOptions,
      isOwner,
      isAcceptedParticipant,
      canInvite: permissions?.canInvite ?? fallbackCanInvite,
      canStart: permissions?.canStart ?? true,
      canAcceptInvitation: permissions?.canAcceptInvitation ?? false,
      canLeave: permissions?.canLeave ?? false,
      canRemoveMembers: permissions?.canRemoveMembers ?? false,
      canDeleteSession: permissions?.canDeleteSession ?? false,
    };
  }

  private buildParticipants(members: ReturnType<typeof this.questsService.collaborativeMembers>) {
    return members
      .filter(
        (member) =>
          ['ACCEPTED', 'PENDING'].includes(member.status),
      )
      .sort((a, b) => this.getMemberOrder(a) - this.getMemberOrder(b))
      .map((member) => ({
        member,
        user: this.questsService.users().find((user) => user.id === member.user_id),
        isCurrentUser: member.user_id === this.questsService.currentUserId(),
      }));
  }

  private buildInviteOptions(
    questId: number,
    sessionId: number | undefined,
    members: ReturnType<typeof this.questsService.collaborativeMembers>,
    unavailableUserIds: number[],
  ) {
    const currentUserId = this.questsService.currentUserId();
    const friends = this.questsService
      .friends()
      .filter((friend) => friend.status.toUpperCase() === 'ACCEPTED')
      .map((friend) => (friend.user_id === currentUserId ? friend.friend_id : friend.user_id));
    return [...new Set(friends)]
      .map((friendUserId) => this.questsService.users().find((user) => user.id === friendUserId))
      .filter((user) => Boolean(user))
      .map((user) => {
        const alreadyInvited = sessionId
          ? members.some(
              (member) =>
                member.session_id === sessionId &&
                member.user_id === user!.id &&
                ['ACCEPTED', 'PENDING'].includes(member.status),
            )
          : false;
        const isBusy = unavailableUserIds.includes(user!.id);
        return {
          user,
          alreadyInvited,
          isBusy,
          canInvite: !alreadyInvited && !isBusy,
        };
      });
  }

  private getMemberOrder(member: ReturnType<typeof this.questsService.collaborativeMembers>[number]): number {
    if (member.role === 'OWNER') return 0;
    if (member.status === 'ACCEPTED') return 1;
    return 2;
  }

  private buildMinigameUrl(url: string, questId: number): string {
    const minigameUrl = new URL(url, window.location.origin);
    minigameUrl.searchParams.set('questId', String(questId));
    return minigameUrl.toString();
  }
}
