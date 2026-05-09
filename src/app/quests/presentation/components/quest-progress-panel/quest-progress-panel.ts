import {Component, computed, inject} from '@angular/core';
import {RouterLink} from '@angular/router';
import {QuestSummary, QuestsService} from '../../../application/quests.service';

interface ProgressPanelItem {
  questId: number;
  label: string;
  progress: number;
  route: (string | number)[];
}

@Component({
  selector: 'app-quest-progress-panel',
  imports: [RouterLink],
  templateUrl: './quest-progress-panel.html',
  styleUrl: './quest-progress-panel.css',
})
export class QuestProgressPanel {
  private readonly questsService = inject(QuestsService);
  private readonly questSummaries = this.questsService.getQuestSummaries();

  readonly maxProgressItems = 4;

  private readonly activeProgressSummaries = computed(() =>
    this.pickProgressSummaries(
      this.questSummaries(),
      (summary) => summary.started && !summary.completed,
    ),
  );

  readonly progressItems = computed<ProgressPanelItem[]>(() => {
    return this.activeProgressSummaries()
      .slice(0, this.maxProgressItems)
      .map((summary) => ({
        questId: summary.quest.id,
        label: summary.quest.title,
        progress: Math.round(summary.progress),
        route: this.getProgressItemRoute(summary),
      }));
  });

  readonly hasMoreProgressItems = computed(() => this.activeProgressSummaries().length > this.maxProgressItems);

  private pickProgressSummaries(
    summaries: QuestSummary[],
    predicate: (summary: QuestSummary) => boolean,
  ): QuestSummary[] {
    return summaries
      .filter(predicate)
      .sort((a, b) => {
        const categoryOrder = this.getCategoryOrder(a.quest.category) - this.getCategoryOrder(b.quest.category);
        return categoryOrder === 0 ? a.quest.id - b.quest.id : categoryOrder;
      });
  }

  private getCategoryOrder(category: string): number {
    if (category === 'daily_quest') {
      return 0;
    }
    return 1;
  }

  private getProgressItemRoute(summary: QuestSummary): (string | number)[] {
    if (summary.quest.type === 'activities') {
      return ['/quests', summary.quest.id, 'activities'];
    }

    return ['/quests', summary.quest.id];
  }
}
