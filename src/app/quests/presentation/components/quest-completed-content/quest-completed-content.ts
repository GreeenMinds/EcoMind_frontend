import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';
import { QuestsService } from '../../../application/quests.service';
import { CommunityService } from '../../../../community/application/community.service';

type ShareState = 'idle' | 'sharing' | 'shared' | 'error';

interface ShareAchievementDraft {
  content: string;
  points: number;
  image_url: string | null;
  savedAt: string;
}

@Component({
  selector: 'app-quest-completed-content',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './quest-completed-content.html',
  styleUrl: './quest-completed-content.css',
})
export class QuestCompletedContent {
  private readonly questsService = inject(QuestsService);
  private readonly communityService = inject(CommunityService);
  private readonly route = inject(ActivatedRoute);

  readonly shareState = signal<ShareState>('idle');
  readonly hasDraft = signal<boolean>(false);

  readonly imageSrc = '/assets/images/quests/activity-completed.png';
  readonly questId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('questId')))),
    { initialValue: Number(this.route.snapshot.paramMap.get('questId')) },
  );
  readonly returnUrl = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('returnUrl') || '/quests')),
    { initialValue: this.route.snapshot.queryParamMap.get('returnUrl') || '/quests' },
  );
  readonly completedExpiredQuest = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('expired') === 'true')),
    { initialValue: this.route.snapshot.queryParamMap.get('expired') === 'true' },
  );
  readonly detail = computed(() => {
    const id = this.questId();
    const quest = Number.isFinite(id) ? this.questsService.getQuestById(id)() : undefined;
    return quest ? { quest } : undefined;
  });

  constructor() {
    this.hasDraft.set(this.readShareDraft() !== null);
  }

  shareToCommunity(): void {
    const draft = this.buildShareDraft();

    if (!draft) {
      return;
    }

    this.shareState.set('sharing');
    this.communityService
      .shareAchievement({
        content: draft.content,
        points: draft.points,
        image_url: draft.image_url,
      })
      .subscribe({
        next: () => {
          this.clearShareDraft();
          this.shareState.set('shared');
        },
        error: () => {
          this.saveShareDraft(draft);
          this.shareState.set('error');
        },
      });
  }

  private buildShareDraft(): ShareAchievementDraft | null {
    const storedDraft = this.readShareDraft();

    if (storedDraft) {
      return storedDraft;
    }

    const detail = this.detail();

    if (!detail) {
      return null;
    }

    const quest = detail.quest;
    return {
      content: `Complete el reto "${quest.title}"`,
      points: this.completedExpiredQuest() ? 0 : quest.reward_ecopoints,
      image_url: quest.image_url,
      savedAt: new Date().toISOString(),
    };
  }

  private saveShareDraft(draft: ShareAchievementDraft): void {
    try {
      localStorage.setItem(
        this.shareDraftStorageKey(),
        JSON.stringify({
          ...draft,
          savedAt: new Date().toISOString(),
        }),
      );
      this.hasDraft.set(true);
    } catch {
      this.hasDraft.set(false);
    }
  }

  private readShareDraft(): ShareAchievementDraft | null {
    try {
      const rawDraft = localStorage.getItem(this.shareDraftStorageKey());

      if (!rawDraft) {
        return null;
      }

      const draft = JSON.parse(rawDraft) as Partial<ShareAchievementDraft>;

      if (
        typeof draft.content !== 'string' ||
        typeof draft.points !== 'number' ||
        !('image_url' in draft)
      ) {
        return null;
      }

      return {
        content: draft.content,
        points: draft.points,
        image_url: draft.image_url ?? null,
        savedAt: typeof draft.savedAt === 'string' ? draft.savedAt : new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }

  private clearShareDraft(): void {
    try {
      localStorage.removeItem(this.shareDraftStorageKey());
    } finally {
      this.hasDraft.set(false);
    }
  }

  private shareDraftStorageKey(): string {
    const id = this.questId();
    return `ecomind.quest-share-draft.${Number.isFinite(id) ? id : 'unknown'}`;
  }
}
