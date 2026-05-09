import {Component, computed, inject, signal} from '@angular/core';
import {Router} from '@angular/router';
import {QuestsService} from '../../../application/quests.service';
import {QuestCardGrid} from '../quest-card-grid/quest-card-grid';
import {QuestCategorySelector} from '../quest-category-selector/quest-category-selector';

@Component({
  selector: 'app-quest-list-content',
  imports: [QuestCategorySelector, QuestCardGrid],
  templateUrl: './quest-list-content.html',
  styleUrl: './quest-list-content.css',
})
export class QuestListContent {
  private readonly questsService = inject(QuestsService);
  private readonly router = inject(Router);

  readonly categories = ['energy', 'water', 'recycle', 'daily_quest'];
  readonly selectedCategory = signal('energy');

  readonly filteredQuests = computed(() =>
    this.questsService
      .getQuestSummaries()()
      .filter((summary) => summary.quest.category === this.selectedCategory()),
  );

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  selectQuest(questId: number): void {
    void this.router.navigate(['/quests', questId]);
  }
}
