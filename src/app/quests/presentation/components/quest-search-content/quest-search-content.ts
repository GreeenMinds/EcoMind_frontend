import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { QuestsService } from '../../../application/quests.service';
import { Quest } from '../../../domain/model/quest.entity';
import { QuestProgressService } from '../../../application/quest-progress.service';

@Component({
  selector: 'app-quest-search-content',
  imports: [RouterLink, TranslatePipe],
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

  readonly categories = computed(() => [
    'all',
    ...this.getUniqueSortedValues(this.questsService.quests().map((quest) => quest.category)),
  ]);

  readonly questTypes = computed(() => [
    'all',
    ...this.getUniqueSortedValues(this.questsService.quests().map((quest) => quest.type)),
  ]);

  readonly activityTypes = computed(() => [
    'all',
    ...this.getUniqueSortedValues(
      this.questsService
        .quests()
        .filter((quest) => ['activities', 'collaborative'].includes(quest.type))
        .map((quest) => quest.theme_type),
    ),
  ]);

  readonly filteredQuests = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const category = this.selectedCategory();
    const questType = this.selectedQuestType();
    const activityType = this.selectedActivityType();
    const age = this.getMinimumAgeValue();

    return this.questsService.quests().filter((quest) => {
      const searchableText = [
        quest.title,
        quest.description,
        quest.category,
        quest.type,
        quest.theme_type,
      ]
        .join(' ')
        .toLowerCase();

      return (
        (!term || searchableText.includes(term)) &&
        (category === 'all' || quest.category === category) &&
        (questType === 'all' || quest.type === questType) &&
        (questType === 'minigame' || activityType === 'all' || quest.theme_type === activityType) &&
        quest.age <= age
      );
    });
  });

  applySearch(): void {
    this.searchTerm.set(this.searchInput());
  }

  updateSearchInput(event: Event): void {
    this.searchInput.set((event.target as HTMLInputElement).value);
  }

  updateCategory(event: Event): void {
    this.selectedCategory.set((event.target as HTMLSelectElement).value);
  }

  updateQuestType(event: Event): void {
    const questType = (event.target as HTMLSelectElement).value;
    this.selectedQuestType.set(questType);
    if (questType === 'minigame') {
      this.selectedActivityType.set('all');
    }
  }

  updateActivityType(event: Event): void {
    this.selectedActivityType.set((event.target as HTMLSelectElement).value);
  }

  updateAge(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.minimumAge.set(value);
  }

  clearFilters(): void {
    this.searchInput.set('');
    this.searchTerm.set('');
    this.selectedCategory.set('all');
    this.selectedQuestType.set('all');
    this.selectedActivityType.set('all');
    this.minimumAge.set('');
  }

  handleQuestAction(quest: Quest): void {
    if (quest.completed) {
      this.questProgressService.addQuestProgress(quest.id);
      if (['activities', 'collaborative'].includes(quest.type)) {
        void this.router.navigate(['/quests', quest.id, 'started']);
        return;
      }
      void this.router.navigate(['/quests', quest.id]);
      return;
    }

    if (quest.started) {
      void this.router.navigate(this.getQuestRoute(quest));
      return;
    }

    this.questProgressService.addQuestProgress(quest.id);
    if (['activities', 'collaborative'].includes(quest.type)) {
      void this.router.navigate(['/quests', quest.id, 'started']);
      return;
    }

    void this.router.navigate(['/quests', quest.id]);
  }

  getActionLabel(quest: Quest): string {
    if (quest.completed) {
      return this.translate.instant('quests.actions.startAgain');
    }
    if (quest.started) {
      return this.translate.instant(
        quest.type === 'activities' ? 'quests.actions.viewActivity' : 'quests.actions.viewQuest',
      );
    }
    return this.translate.instant('quests.actions.start');
  }

  getCategoryLabel(category: string): string {
    const key = `quests.categories.${category}`;
    const translated = this.translate.instant(key);
    return translated === key ? category.replaceAll('_', ' ') : translated;
  }

  getQuestTypeLabel(type: string): string {
    const key = `quests.types.${type}`;
    const translated = this.translate.instant(key);
    return translated === key ? type : translated;
  }

  getActivityTypeLabel(type: string): string {
    const key = `quests.activityTypes.${type}`;
    const translated = this.translate.instant(key);
    return translated === key ? type : translated;
  }

  getQuestAgeLabel(quest: Quest): string {
    return quest.age > 0
      ? this.translate.instant('common.yearsPlus', { count: quest.age })
      : this.translate.instant('common.general');
  }

  getRewardLabel(quest: Quest): string {
    if (quest.reward_ecopoints > 0) {
      return this.translate.instant('common.ecoPoints', { count: quest.reward_ecopoints });
    }
    return this.translate.instant('common.gems', { count: quest.reward_gems });
  }

  getQuestDisplayType(quest: Quest): string {
    return quest.type === 'collaborative' ? 'collaborative' : quest.theme_type;
  }

  getQuestTypeTheme(type: string): Record<string, string> {
    const themes: Record<string, Record<string, string>> = {
      checkbox: {
        '--quest-bg': '#66d575',
        '--quest-shadow': '#159E67',
        '--quest-top-light': '#76ea85',
      },
      minigame: {
        '--quest-bg': '#3fa8f5',
        '--quest-shadow': '#4b66df',
        '--quest-top-light': '#83caff',
      },
      collaborative: {
        '--quest-bg': '#ffc44d',
        '--quest-shadow': '#d9901f',
        '--quest-top-light': '#ffe079',
      },
    };

    return (
      themes[type] ?? {
        '--quest-bg': '#9aa3ad',
        '--quest-shadow': '#707984',
        '--quest-top-light': '#c8ced6',
      }
    );
  }

  getQuestTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      checkbox: '/assets/images/quests/checkbox.png',
      minigame: '/assets/images/quests/game.png',
      collaborative: '/assets/images/quests/light.png',
    };

    return icons[type] ?? '/assets/images/quests/checkbox.png';
  }

  private getQuestRoute(quest: Quest): (string | number)[] {
    if (['activities', 'collaborative'].includes(quest.type)) {
      return ['/quests', quest.id, 'activities'];
    }
    return ['/quests', quest.id];
  }

  private getMinimumAgeValue(): number {
    const age = Number(this.minimumAge().trim() || 0);
    return Number.isFinite(age) && age > 0 ? age : 0;
  }

  private getUniqueSortedValues(values: string[]): string[] {
    return [...new Set(values)].sort((a, b) => a.localeCompare(b));
  }
}
