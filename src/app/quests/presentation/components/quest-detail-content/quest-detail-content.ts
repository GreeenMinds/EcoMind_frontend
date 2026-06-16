import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs';
import { QuestsService } from '../../../application/quests.service';
import { MonetizationStoreService } from '../../../../monetization/application/monetization-store.service';
import { QuestProgressService } from '../../../application/quest-progress.service';
import { CollaborativeQuestsService } from '../../../application/collaborative-quests.service';
import { CollaborativeQuestMember } from '../../../domain/model/collaborative-quest-member.entity';
import { CollaborativeQuestSession } from '../../../domain/model/collaborative-quest-session.entity';

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
    return detail?.quest.type === 'collaborative'
      ? this.buildCollaborativeContext(detail.quest.id)
      : undefined;
  });

  readonly actionLabel = computed(() => {
    const detail = this.detail();
    if (!detail) return this.translate.instant('quests.actions.startActivity');

    if (detail.quest.type === 'minigame') {
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
    return detail?.quest.type !== 'collaborative' || !context?.pendingInvitation;
  });

  readonly primaryActionDisabled = computed(() => {
    const detail = this.detail();
    const context = this.collaborativeContext();
    return Boolean(
      detail?.quest.type === 'collaborative' &&
      !detail.started &&
      !context?.canStart,
    );
  });

  startQuest(): void {
    const detail = this.detail();
    if (!detail) return;
    if (this.primaryActionDisabled()) return;

    if (detail.quest.type === 'minigame') {
      if (!detail.started) {
        this.questProgressService.addQuestProgress(detail.quest.id);
      }
      if (detail.minigame?.url) {
        window.location.href = detail.minigame.url;
      }
      return;
    }

    if (detail.quest.type === 'collaborative') {
      if (!detail.started) {
        this.questProgressService.addCollaborativeQuestProgress(detail.quest.id);
        void this.router.navigate(['/quests', detail.quest.id, 'started']);
        return;
      }

      void this.router.navigate(['/quests', detail.quest.id, 'activities']);
      return;
    }

    if (!detail.started) {
      this.questProgressService.addQuestProgress(detail.quest.id);
      void this.router.navigate(['/quests', detail.quest.id, 'started']);
      return;
    }

    void this.router.navigate(['/quests', detail.quest.id, 'activities']);
  }

  formatCategory(category: string): string {
    const key = `quests.categories.${category}`;
    const translated = this.translate.instant(key);
    return translated === key ? category.replaceAll('_', ' ') : translated;
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
    const currentUserId = this.questsService.currentUserId();
    const visibleSessions = this.questsService
      .collaborativeSessions()
      .filter((session) => session.quest_id === questId)
      .filter((session) =>
        this.questsService
          .collaborativeMembers()
          .some(
            (member) =>
              member.session_id === session.id &&
              member.user_id === currentUserId &&
              ['accepted', 'pending'].includes(member.status),
          ),
      );
    const ownedOpenSession = this.findCurrentUserOwnedOpenSession(questId);
    const acceptedSession = visibleSessions.find((session) =>
      this.questsService
        .collaborativeMembers()
        .some(
          (member) =>
            member.session_id === session.id &&
            member.user_id === currentUserId &&
            member.status === 'accepted',
        ),
    );
    const pendingInvitation = this.findPendingInvitationForCurrentUser(questId);
    const session =
      ownedOpenSession ?? acceptedSession ?? this.findSessionForMember(pendingInvitation);
    const currentMember = session
      ? this.questsService
          .collaborativeMembers()
          .find((member) => member.session_id === session.id && member.user_id === currentUserId)
      : undefined;
    const participants = session ? this.buildParticipants(session.id) : [];
    const inviteOptions = this.buildInviteOptions(questId, session?.id);
    const isOwner = Boolean(session && session.owner_user_id === currentUserId);
    const isAcceptedParticipant = currentMember?.status === 'accepted';
    const acceptedInvites = participants.filter(
      (participant) =>
        participant.member.role !== 'owner' && participant.member.status === 'accepted',
    ).length;
    const activeInvites = session
      ? this.questsService
          .collaborativeMembers()
          .filter(
            (member) =>
              member.session_id === session.id &&
              member.role !== 'owner' &&
              ['accepted', 'pending'].includes(member.status),
          ).length
      : 0;
    const pendingInvites = participants.filter(
      (participant) =>
        participant.member.role !== 'owner' && participant.member.status === 'pending',
    ).length;

    return {
      session,
      currentMember,
      pendingInvitation,
      participants,
      inviteOptions,
      isOwner,
      isAcceptedParticipant,
      canInvite: (!session || (isOwner && session.status === 'pending')) && activeInvites < 5,
      canStart:
        isOwner &&
        session?.status === 'pending' &&
        acceptedInvites > 0 &&
        pendingInvites === 0,
      canAcceptInvitation: Boolean(
        pendingInvitation &&
        this.findSessionForMember(pendingInvitation)?.status === 'pending' &&
        !this.isUserBusyInQuest(currentUserId, questId),
      ),
      canLeave:
        isAcceptedParticipant &&
        currentMember?.role !== 'owner' &&
        session?.status === 'pending',
    };
  }

  private buildParticipants(sessionId: number) {
    return this.questsService
      .collaborativeMembers()
      .filter(
        (member) =>
          member.session_id === sessionId && ['accepted', 'pending'].includes(member.status),
      )
      .sort((a, b) => this.getMemberOrder(a) - this.getMemberOrder(b))
      .map((member) => ({
        member,
        user: this.questsService.users().find((user) => user.id === member.user_id),
        isCurrentUser: member.user_id === this.questsService.currentUserId(),
      }));
  }

  private buildInviteOptions(questId: number, sessionId?: number) {
    const currentUserId = this.questsService.currentUserId();
    const friends = this.questsService
      .friends()
      .filter((friend) => friend.status === 'accepted')
      .map((friend) => (friend.user_id === currentUserId ? friend.friend_id : friend.user_id));
    return [...new Set(friends)]
      .map((friendUserId) => this.questsService.users().find((user) => user.id === friendUserId))
      .filter((user) => Boolean(user))
      .map((user) => {
        const alreadyInvited = sessionId
          ? this.questsService
              .collaborativeMembers()
              .some(
                (member) =>
                  member.session_id === sessionId &&
                  member.user_id === user!.id &&
                  ['accepted', 'pending'].includes(member.status),
              )
          : false;
        const isBusy = this.isUserBusyInQuest(user!.id, questId);
        return {
          user,
          alreadyInvited,
          isBusy,
          canInvite: !alreadyInvited && !isBusy,
        };
      });
  }

  private getMemberOrder(member: CollaborativeQuestMember): number {
    if (member.role === 'owner') return 0;
    if (member.status === 'accepted') return 1;
    return 2;
  }

  private findPendingInvitationForCurrentUser(
    questId: number,
  ): CollaborativeQuestMember | undefined {
    return this.questsService.collaborativeMembers().find((member) => {
      const session = this.findSessionForMember(member);
      return (
        member.user_id === this.questsService.currentUserId() &&
        member.status === 'pending' &&
        session?.quest_id === questId &&
        session.status === 'pending'
      );
    });
  }

  private findSessionForMember(
    member?: CollaborativeQuestMember,
  ): CollaborativeQuestSession | undefined {
    return member
      ? this.questsService
          .collaborativeSessions()
          .find((session) => session.id === member.session_id)
      : undefined;
  }

  private findCurrentUserOwnedOpenSession(questId: number): CollaborativeQuestSession | undefined {
    return this.questsService
      .collaborativeSessions()
      .filter(
        (session) =>
          session.quest_id === questId &&
          session.owner_user_id === this.questsService.currentUserId() &&
          session.status === 'pending',
      )
      .sort((a, b) => b.id - a.id)[0];
  }

  private isUserBusyInQuest(userId: number, questId: number): boolean {
    const hasIndividualActiveQuest = this.questsService
      .questsUser()
      .some(
        (questUser) =>
          questUser.user_id === userId &&
          questUser.quest_id === questId &&
          questUser.collaborative_session_id === null &&
          questUser.status !== 'completed',
      );
    if (hasIndividualActiveQuest) return true;

    return this.questsService.collaborativeMembers().some((member) => {
      const session = this.findSessionForMember(member);
      if (
        member.user_id !== userId ||
        member.status !== 'accepted' ||
        session?.quest_id !== questId ||
        !['pending', 'started'].includes(session.status)
      ) {
        return false;
      }

      if (session.status === 'pending') return true;

      return this.questsService
        .questsUser()
        .some(
          (questUser) =>
            questUser.user_id === userId &&
            questUser.quest_id === questId &&
            questUser.collaborative_session_id === session.id &&
            questUser.status !== 'completed',
        );
    });
  }
}
