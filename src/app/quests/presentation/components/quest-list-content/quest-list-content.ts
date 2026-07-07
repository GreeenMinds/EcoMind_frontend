import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { QuestsService } from '../../../application/quests.service';
import { Quest } from '../../../domain/model/quest.entity';
import { QuestCardGrid } from '../quest-card-grid/quest-card-grid';
import { QuestCategorySelector } from '../quest-category-selector/quest-category-selector';

@Component({
  selector: 'app-quest-list-content',
  imports: [QuestCategorySelector, QuestCardGrid],
  templateUrl: './quest-list-content.html',
  styleUrl: './quest-list-content.css',
})
export class QuestListContent {
  private readonly questsService = inject(QuestsService);
  private readonly router = inject(Router);

  readonly categories = ['ENERGY', 'WATER', 'RECYCLE', 'DAILY_QUEST'];
  readonly selectedCategory = this.questsService.selectedListCategory;
  readonly selectedPage = this.questsService.selectedListPage;

  readonly filteredQuests = computed(() =>
    this.sortQuestsForSelectedCategory(
      this.questsService
        .quests()
        .filter((quest) => quest.type !== 'FAMILY')
        .filter((quest) => this.matchesSelectedCategory(quest)),
    ),
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

  private matchesSelectedCategory(quest: Quest): boolean {
    if (this.selectedCategory() === 'DAILY_QUEST') {
      return this.isDailyQuest(quest);
    }

    return quest.category === this.selectedCategory() && !this.isDailyQuest(quest);
  }

  private sortQuestsForSelectedCategory(quests: Quest[]): Quest[] {
    if (this.selectedCategory() !== 'DAILY_QUEST') {
      return quests;
    }

    return [...quests].sort(
      (left, right) => this.getAssignedDateTime(right) - this.getAssignedDateTime(left),
    );
  }

  private getAssignedDateTime(quest: Quest): number {
    return quest.assignedDate ? new Date(quest.assignedDate).getTime() : 0;
  }

  private isDailyQuest(quest: Quest): boolean {
    return quest.type.toUpperCase() === 'DAILY_QUEST';
  }
}
