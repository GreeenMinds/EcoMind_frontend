import {Component, computed, inject} from '@angular/core';
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
  readonly selectedCategory = this.questsService.selectedListCategory;
  readonly selectedPage = this.questsService.selectedListPage;

  readonly filteredQuests = computed(() =>
    this.questsService
      .getQuestSummaries()()
      .filter((summary) => summary.quest.category === this.selectedCategory()),
  );

  selectCategory(category: string): void {
    this.questsService.selectListCategory(category);
  }

  selectPage(page: number): void {
    this.questsService.selectListPage(page);
  }

  selectQuest(questId: number): void {
    void this.router.navigate(['/quests', questId]);
  }
}
