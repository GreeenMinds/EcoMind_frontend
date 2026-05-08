import {Component, computed, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {map} from 'rxjs';
import {QuestsService} from '../../../application/quests.service';

@Component({
  selector: 'app-quest-detail-content',
  imports: [RouterLink],
  templateUrl: './quest-detail-content.html',
  styleUrl: './quest-detail-content.css',
})
export class QuestDetailContent {
  private readonly questsService = inject(QuestsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly questId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('questId')))),
    {initialValue: Number(this.route.snapshot.paramMap.get('questId'))},
  );
  readonly detail = computed(() => {
    const id = this.questId();
    return Number.isFinite(id) ? this.questsService.getQuestDetail(id)() : undefined;
  });

  readonly actionLabel = computed(() => {
    const detail = this.detail();
    if (!detail) return 'Start activity';

    if (detail.quest.type === 'minigame') {
      return detail.latestMinigameAttempt ? 'Play again' : 'Play';
    }

    return detail.started ? 'View activity' : 'Start activity';
  });

  startQuest(): void {
    const detail = this.detail();
    if (!detail) return;

    if (detail.quest.type === 'minigame') {
      if (!detail.started) {
        this.questsService.startQuest(detail.quest.id);
      }
      if (detail.minigame?.url) {
        window.location.href = detail.minigame.url;
      }
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
      return `${detail.quest.reward_ecopoints} ecoPoints`;
    }

    return `+${detail.quest.reward_gems} gems`;
  }

  formatCategory(category: string): string {
    return category.replaceAll('_', ' ');
  }

}
