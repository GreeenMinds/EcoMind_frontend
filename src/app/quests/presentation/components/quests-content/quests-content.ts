import {Component, computed, inject, signal} from '@angular/core';
import {QuestsService} from '../../../application/quests.service';
import {QuestCardGrid} from '../quest-card-grid/quest-card-grid';
import {QuestCategorySelector} from '../quest-category-selector/quest-category-selector';

@Component({
  selector: 'app-quests-content',
  imports: [QuestCategorySelector, QuestCardGrid],
  templateUrl: './quests-content.html',
  styleUrl: './quests-content.css',
})
export class QuestsContent {
  private readonly questsService = inject(QuestsService);

  readonly categories = ['energy', 'water', 'recycle', 'daily_quest'];
  readonly selectedCategory = signal('energy');
  readonly selectedQuestId = signal<number | null>(null);

  readonly filteredQuests = computed(() =>
    this.questsService
      .getQuestSummaries()()
      .filter((summary) => summary.quest.category === this.selectedCategory()),
  );

  readonly selectedQuest = computed(() => {
    const id = this.selectedQuestId();
    return id ? this.questsService.getQuestDetail(id)() : undefined;
  });

  readonly canCompleteSelectedQuest = computed(() => {
    const quest = this.selectedQuest();
    if (!quest) return false;

    return quest.activities.length > 0 && quest.activities.every((activity) => activity.completed);
  });

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
    this.selectedQuestId.set(null);
  }

  selectQuest(questId: number): void {
    this.selectedQuestId.set(questId);
  }

  startSelectedQuest(): void {
    const quest = this.selectedQuest();
    if (!quest) return;

    this.questsService.startQuest(quest.quest.id);
  }

  toggleActivity(activityId: number, checked: boolean): void {
    if (checked) {
      this.questsService.completeActivity(activityId);
      return;
    }

    this.questsService.resetActivity(activityId);
  }

  completeSelectedQuest(): void {
    const quest = this.selectedQuest();
    if (!quest) return;

    this.questsService.completeQuest(quest.quest.id);
  }
}
