import {Component, computed, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {map} from 'rxjs';
import {QuestsService} from '../../../application/quests.service';

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
    if (!detail) return this.translate.instant('quests.actions.startActivity');

    if (detail.quest.type === 'minigame') {
      return this.translate.instant(detail.latestMinigameAttempt ? 'quests.actions.playAgain' : 'quests.actions.play');
    }

    return this.translate.instant(detail.started ? 'quests.actions.viewActivity' : 'quests.actions.startActivity');
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
      return this.translate.instant('common.ecoPoints', {count: detail.quest.reward_ecopoints});
    }

    return this.translate.instant('common.gems', {count: detail.quest.reward_gems});
  }

  formatCategory(category: string): string {
    const key = `quests.categories.${category}`;
    const translated = this.translate.instant(key);
    return translated === key ? category.replaceAll('_', ' ') : translated;
  }

}
