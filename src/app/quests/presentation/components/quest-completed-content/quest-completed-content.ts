import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';
import { QuestsService } from '../../../application/quests.service';
import { CommunityService } from '../../../../community/application/community.service';

type ShareState = 'idle' | 'sharing' | 'shared' | 'error';

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

  readonly imageSrc = '/assets/images/quests/activity-completed.png';
  readonly questId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('questId')))),
    { initialValue: Number(this.route.snapshot.paramMap.get('questId')) },
  );
  readonly returnUrl = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('returnUrl') || '/quests')),
    { initialValue: this.route.snapshot.queryParamMap.get('returnUrl') || '/quests' },
  );
  readonly detail = computed(() => {
    const id = this.questId();
    const quest = Number.isFinite(id) ? this.questsService.getQuestById(id)() : undefined;
    return quest ? { quest } : undefined;
  });

  shareToCommunity(): void {
    const detail = this.detail();
    if (!detail) {
      return;
    }

    const quest = detail.quest;
    this.shareState.set('sharing');
    this.communityService
      .shareAchievement({
        content: `Complete el reto "${quest.title}"`,
        points: quest.reward_ecopoints,
        image_url: quest.image_url,
      })
      .subscribe({
        next: () => this.shareState.set('shared'),
        error: () => this.shareState.set('error'),
      });
  }
}
