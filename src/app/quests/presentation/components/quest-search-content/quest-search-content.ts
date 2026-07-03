import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { QuestsService } from '../../../application/quests.service';
import { Quest } from '../../../domain/model/quest.entity';
import { QuestProgressService } from '../../../application/quest-progress.service';
import { QuestSearchResultGrid } from '../quest-search-result-grid/quest-search-result-grid';

@Component({
  selector: 'app-quest-search-content',
  imports: [RouterLink, TranslatePipe, QuestSearchResultGrid],
  templateUrl: './quest-search-content.html',
  styleUrl: './quest-search-content.css',
})
export class QuestSearchContent {
  readonly questsService = inject(QuestsService);
  private readonly questProgressService = inject(QuestProgressService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly searchInput = signal('');
  readonly searchTerm = signal('');
  readonly selectedCategory = signal('all');
  readonly selectedQuestType = signal('all');
  readonly selectedActivityType = signal('all');
  readonly minimumAge = signal('');

  readonly categories = ['all', 'WATER', 'RECYCLE', 'ENERGY'];
  readonly questTypes = ['all', 'COLLABORATIVE', 'MINIGAME', 'ACTIVITIES', 'DAILY_QUEST'];
  readonly activityTypes = ['all', 'CHECKBOX', 'MINIGAME', 'COLLABORATIVE'];
  readonly filteredQuests = this.questsService.questSearchResults;

  applySearch(): void {
    this.searchTerm.set(this.searchInput());
    this.search();
  }

  updateSearchInput(event: Event): void {
    this.searchInput.set((event.target as HTMLInputElement).value);
  }

  updateCategory(event: Event): void {
    this.selectedCategory.set((event.target as HTMLSelectElement).value);
    this.search();
  }

  updateQuestType(event: Event): void {
    const questType = (event.target as HTMLSelectElement).value;
    this.selectedQuestType.set(questType);
    if (questType === 'MINIGAME') {
      this.selectedActivityType.set('all');
    }
    this.search();
  }

  updateActivityType(event: Event): void {
    this.selectedActivityType.set((event.target as HTMLSelectElement).value);
    this.search();
  }

  updateAge(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.minimumAge.set(value);
    this.search();
  }

  clearFilters(): void {
    this.searchInput.set('');
    this.searchTerm.set('');
    this.selectedCategory.set('all');
    this.selectedQuestType.set('all');
    this.selectedActivityType.set('all');
    this.minimumAge.set('');
    this.search();
  }

  handleQuestAction(quest: Quest): void {
    if (quest.completed) {
      this.questProgressService.addQuestProgress(quest.id).subscribe({
        next: () => {
          if (['ACTIVITIES', 'COLLABORATIVE'].includes(quest.type)) {
            void this.router.navigate(['/quests', quest.id, 'started']);
            return;
          }
          void this.router.navigate(['/quests', quest.id]);
        },
      });
      return;
    }

    if (quest.started) {
      void this.router.navigate(this.getQuestRoute(quest));
      return;
    }

    this.questProgressService.addQuestProgress(quest.id).subscribe({
      next: () => {
        if (['ACTIVITIES', 'COLLABORATIVE'].includes(quest.type)) {
          void this.router.navigate(['/quests', quest.id, 'started']);
          return;
        }

        void this.router.navigate(['/quests', quest.id]);
      },
    });
  }

  getCategoryLabel(category: string): string {
    const key = `quests.categories.${category.toLowerCase()}`;
    const translated = this.translate.instant(key);
    return translated === key ? category.toLowerCase().replaceAll('_', ' ') : translated;
  }

  getQuestTypeLabel(type: string): string {
    const key = `quests.types.${type.toLowerCase()}`;
    const translated = this.translate.instant(key);
    return translated === key ? type : translated;
  }

  getActivityTypeLabel(type: string): string {
    const key = `quests.activityTypes.${type.toLowerCase()}`;
    const translated = this.translate.instant(key);
    return translated === key ? type : translated;
  }

  private getQuestRoute(quest: Quest): (string | number)[] {
    if (['ACTIVITIES', 'COLLABORATIVE'].includes(quest.type)) {
      return ['/quests', quest.id, 'activities'];
    }
    return ['/quests', quest.id];
  }

  private getMinimumAgeValue(): number | null {
    const value = this.minimumAge().trim();
    if (!value) {
      return null;
    }

    const age = Number(value);
    return Number.isFinite(age) && age >= 0 ? age : null;
  }

  private search(): void {
    this.questsService.searchQuests({
      title: this.searchTerm().trim() || null,
      category: this.toFilterValue(this.selectedCategory()),
      questType: this.toFilterValue(this.selectedQuestType()),
      age: this.getMinimumAgeValue(),
      type:
        this.selectedQuestType() === 'MINIGAME'
          ? null
          : this.toFilterValue(this.selectedActivityType()),
    });
  }

  private toFilterValue(value: string): string | null {
    return value === 'all' ? null : value;
  }

}
