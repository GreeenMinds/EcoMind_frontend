import {Component, computed, inject, signal} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {QuestSummary, QuestsService} from '../../../application/quests.service';

@Component({
  selector: 'app-quest-search-content',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './quest-search-content.html',
  styleUrl: './quest-search-content.css',
})
export class QuestSearchContent {
  readonly questsService = inject(QuestsService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly questSummaries = this.questsService.getQuestSummaries();

  readonly searchInput = signal('');
  readonly searchTerm = signal('');
  readonly selectedCategory = signal('all');
  readonly selectedQuestType = signal('all');
  readonly selectedActivityType = signal('all');
  readonly minimumAge = signal('');

  readonly categories = computed(() => [
    'all',
    ...this.getUniqueSortedValues(this.questSummaries().map((summary) => summary.quest.category)),
  ]);

  readonly questTypes = computed(() => [
    'all',
    ...this.getUniqueSortedValues(this.questSummaries().map((summary) => summary.quest.type)),
  ]);

  readonly activityTypes = computed(() => [
    'all',
    ...this.getUniqueSortedValues(
      this.questSummaries()
        .filter((summary) => ['activities', 'collaborative'].includes(summary.quest.type))
        .map((summary) => summary.themeType),
    ),
  ]);

  readonly filteredQuests = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const category = this.selectedCategory();
    const questType = this.selectedQuestType();
    const activityType = this.selectedActivityType();
    const age = this.getMinimumAgeValue();

    return this.questSummaries().filter((summary) => {
      const searchableText = [
        summary.quest.title,
        summary.quest.description,
        summary.quest.category,
        summary.quest.type,
        summary.themeType,
      ].join(' ').toLowerCase();

      return (
        (!term || searchableText.includes(term)) &&
        (category === 'all' || summary.quest.category === category) &&
        (questType === 'all' || summary.quest.type === questType) &&
            (questType === 'minigame' || activityType === 'all' || summary.themeType === activityType) &&
        summary.quest.age <= age
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

  handleQuestAction(summary: QuestSummary): void {
    if (summary.completed) {
      this.questsService.startQuest(summary.quest.id);
      if (['activities', 'collaborative'].includes(summary.quest.type)) {
        void this.router.navigate(['/quests', summary.quest.id, 'started']);
        return;
      }
      void this.router.navigate(['/quests', summary.quest.id]);
      return;
    }

    if (summary.started) {
      void this.router.navigate(this.getQuestRoute(summary));
      return;
    }

    this.questsService.startQuest(summary.quest.id);
    if (['activities', 'collaborative'].includes(summary.quest.type)) {
      void this.router.navigate(['/quests', summary.quest.id, 'started']);
      return;
    }

    void this.router.navigate(['/quests', summary.quest.id]);
  }

  getActionLabel(summary: QuestSummary): string {
    if (summary.completed) {
      return this.translate.instant('quests.actions.startAgain');
    }
    if (summary.started) {
      return this.translate.instant(summary.quest.type === 'activities' ? 'quests.actions.viewActivity' : 'quests.actions.viewQuest');
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

  getQuestAgeLabel(summary: QuestSummary): string {
    return summary.quest.age > 0
      ? this.translate.instant('common.yearsPlus', {count: summary.quest.age})
      : this.translate.instant('common.general');
  }

  getRewardLabel(summary: QuestSummary): string {
    if (summary.quest.reward_ecopoints > 0) {
      return this.translate.instant('common.ecoPoints', {count: summary.quest.reward_ecopoints});
    }
    return this.translate.instant('common.gems', {count: summary.quest.reward_gems});
  }

  getQuestDisplayType(summary: QuestSummary): string {
    return summary.quest.type === 'collaborative' ? 'collaborative' : summary.themeType;
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

    return themes[type] ?? {
      '--quest-bg': '#9aa3ad',
      '--quest-shadow': '#707984',
      '--quest-top-light': '#c8ced6',
    };
  }

  getQuestTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      checkbox: '/assets/images/quests/checkbox.png',
      minigame: '/assets/images/quests/game.png',
      collaborative: '/assets/images/quests/light.png',
    };

    return icons[type] ?? '/assets/images/quests/checkbox.png';
  }

  private getQuestRoute(summary: QuestSummary): (string | number)[] {
    if (['activities', 'collaborative'].includes(summary.quest.type)) {
      return ['/quests', summary.quest.id, 'activities'];
    }
    return ['/quests', summary.quest.id];
  }

  private getMinimumAgeValue(): number {
    const age = Number(this.minimumAge().trim() || 0);
    return Number.isFinite(age) && age > 0 ? age : 0;
  }

  private getUniqueSortedValues(values: string[]): string[] {
    return [...new Set(values)].sort((a, b) => a.localeCompare(b));
  }
}
