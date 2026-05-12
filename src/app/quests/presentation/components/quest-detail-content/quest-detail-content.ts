import {Component, computed, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {map} from 'rxjs';
import {QuestsService} from '../../../application/quests.service';
import {MonetizationStoreService} from '../../../../monetization/application/monetization-store.service';

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

  readonly questId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('questId')))),
    {initialValue: Number(this.route.snapshot.paramMap.get('questId'))},
  );
  readonly detail = computed(() => {
    const id = this.questId();
    return Number.isFinite(id) ? this.questsService.getQuestDetail(id)() : undefined;
  });
  readonly collaborativeContext = computed(() => {
    const detail = this.detail();
    return detail?.quest.type === 'collaborative'
      ? this.questsService.getCollaborativeContext(detail.quest.id)()
      : undefined;
  });

  readonly actionLabel = computed(() => {
    const detail = this.detail();
    if (!detail) return this.translate.instant('quests.actions.startActivity');

    if (detail.quest.type === 'minigame') {
      return this.translate.instant(detail.latestMinigameAttempt ? 'quests.actions.playAgain' : 'quests.actions.play');
    }

    if (detail.completed) {
      return this.translate.instant('quests.actions.startAgain');
    }

    return this.translate.instant(detail.started ? 'quests.actions.viewActivity' : 'quests.actions.startActivity');
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
      context?.isAcceptedParticipant &&
      !context.isOwner &&
      !detail.started,
    );
  });

  startQuest(): void {
    const detail = this.detail();
    if (!detail) return;
    if (this.primaryActionDisabled()) return;

    if (detail.quest.type === 'minigame') {
      if (!detail.started) {
        this.questsService.startQuest(detail.quest.id);
      }
      if (detail.minigame?.url) {
        window.location.href = detail.minigame.url;
      }
      return;
    }

    if (detail.quest.type === 'collaborative') {
      if (!detail.started) {
        this.questsService.startCollaborativeQuest(detail.quest.id);
        void this.router.navigate(['/quests', detail.quest.id, 'started']);
        return;
      }

      void this.router.navigate(['/quests', detail.quest.id, 'activities']);
      return;
    }

    if (!detail.started) {
      this.questsService.startQuest(detail.quest.id);
      void this.router.navigate(['/quests', detail.quest.id, 'started']);
      return;
    }

    void this.router.navigate(['/quests', detail.quest.id, 'activities']);
  }

  getPrimaryReward(detail: NonNullable<ReturnType<typeof this.detail>>): string {
    if (detail.quest.reward_ecopoints > 0) {
      return this.translate.instant('common.ecoPoints', {count: detail.quest.reward_ecopoints});
    }

    return this.translate.instant('common.gems', {count: detail.quest.reward_gems});
  }

  formatCategory(category: string): string {
    const key = `quests.categories.${category}`;
    const translated = this.translate.instant(key);
    return translated === key ? category.replaceAll('_', ' ') : translated;
  }

  inviteFriend(friendUserId: number): void {
    const detail = this.detail();
    if (!detail) return;

    this.questsService.inviteFriendToCollaborativeQuest(detail.quest.id, friendUserId);
  }

  acceptInvitation(memberId: number): void {
    this.questsService.acceptCollaborativeInvitation(memberId);
  }

  declineInvitation(memberId: number): void {
    this.questsService.declineCollaborativeInvitation(memberId);
  }

  leaveQuest(memberId: number): void {
    this.questsService.leaveCollaborativeQuest(memberId);
  }

  removeMember(memberId: number): void {
    this.questsService.removeCollaborativeMember(memberId);
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

}
