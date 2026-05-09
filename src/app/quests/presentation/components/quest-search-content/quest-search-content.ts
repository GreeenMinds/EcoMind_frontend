import {Component, computed, inject, signal} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {QuestSummary, QuestsService} from '../../../application/quests.service';

@Component({
  selector: 'app-quest-search-content',
  imports: [RouterLink],
  templateUrl: './quest-search-content.html',
  styleUrl: './quest-search-content.css',
})
export class QuestSearchContent {
  readonly questsService = inject(QuestsService);
  private readonly router = inject(Router);
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
        .filter((summary) => summary.quest.type === 'activities')
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
      void this.router.navigate(this.getQuestRoute(summary));
      return;
    }

    if (summary.started) {
      void this.router.navigate(this.getQuestRoute(summary));
      return;
    }

    this.questsService.startQuest(summary.quest.id);
    if (summary.quest.type === 'activities') {
      void this.router.navigate(['/quests', summary.quest.id, 'started']);
      return;
    }

    void this.router.navigate(['/quests', summary.quest.id]);
  }

  getActionLabel(summary: QuestSummary): string {
    if (summary.completed) {
      return summary.quest.type === 'activities' ? 'View activity' : 'View quest';
    }
    if (summary.started) {
      return summary.quest.type === 'activities' ? 'View activity' : 'View quest';
    }
    return 'Start';
  }

  getCategoryLabel(category: string): string {
    if (category === 'all') {
      return 'All categories';
    }
    return category.replaceAll('_', ' ');
  }

  getQuestTypeLabel(type: string): string {
    if (type === 'all') {
      return 'All quest types';
    }
    return type === 'activities' ? 'Activities' : 'Minigame';
  }

  getActivityTypeLabel(type: string): string {
    if (type === 'all') {
      return 'All activity types';
    }
    return type === 'checkbox' ? 'Checkbox' : 'Minigame';
  }

  getQuestAgeLabel(summary: QuestSummary): string {
    return summary.quest.age > 0 ? `${summary.quest.age}+ years` : 'General';
  }

  getRewardLabel(summary: QuestSummary): string {
    if (summary.quest.reward_ecopoints > 0) {
      return `${summary.quest.reward_ecopoints} ecoPoints`;
    }
    return `+${summary.quest.reward_gems} gems`;
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
    };

    return icons[type] ?? '/assets/images/quests/checkbox.png';
  }

  private getQuestRoute(summary: QuestSummary): (string | number)[] {
    if (summary.quest.type === 'activities') {
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
