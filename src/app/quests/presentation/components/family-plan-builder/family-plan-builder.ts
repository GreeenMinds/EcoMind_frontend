import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { QuestsService } from '../../../application/quests.service';
import { Quest } from '../../../domain/model/quest.entity';

@Component({
  selector: 'app-family-plan-builder',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './family-plan-builder.html',
  styleUrl: './family-plan-builder.css',
})
export class FamilyPlanBuilder {
  readonly questsService = inject(QuestsService);
  private readonly router = inject(Router);

  readonly searchInput = signal('');
  readonly searchTerm = signal('');
  readonly selectedCategory = signal('all');
  readonly selectedActivityType = signal('all');

  readonly categories = ['all', 'WATER', 'RECYCLE', 'ENERGY'];
  readonly activityTypes = ['all', 'CHECKBOX', 'COLLABORATIVE'];
  readonly familyQuests = this.questsService.questSearchResults;
  readonly selectedQuestIds = computed(() =>
    new Set(this.questsService.draftFamilyPlan()?.items.map((item) => item.questId) ?? []),
  );
  readonly selectedQuests = computed(() =>
    [...this.selectedQuestIds()]
      .map((questId) => this.questsService.getQuestById(questId)())
      .filter((quest): quest is Quest => Boolean(quest)),
  );
  readonly canStartPlan = computed(() =>
    Boolean(this.questsService.draftFamilyPlan() && this.selectedQuestIds().size > 0),
  );

  constructor() {
    this.search();
  }

  updateSearchInput(event: Event): void {
    this.searchInput.set((event.target as HTMLInputElement).value);
  }

  applySearch(): void {
    this.searchTerm.set(this.searchInput());
    this.search();
  }

  updateCategory(event: Event): void {
    this.selectedCategory.set((event.target as HTMLSelectElement).value);
    this.search();
  }

  updateActivityType(event: Event): void {
    this.selectedActivityType.set((event.target as HTMLSelectElement).value);
    this.search();
  }

  addQuest(quest: Quest): void {
    if (this.selectedQuestIds().has(quest.id)) {
      return;
    }
    this.saveDraft([...this.selectedQuestIds(), quest.id]);
  }

  removeQuest(questId: number): void {
    this.saveDraft([...this.selectedQuestIds()].filter((id) => id !== questId));
  }

  startPlan(): void {
    const draft = this.questsService.draftFamilyPlan();
    if (!draft || !this.canStartPlan()) {
      return;
    }

    this.questsService
      .activateFamilyPlanResult(draft.id)
      .subscribe({
        next: (plan) => void this.router.navigate(['/quests/family-plans', plan.id]),
      });
  }

  private saveDraft(questIds: number[]): void {
    this.questsService.saveFamilyPlanDraftItems(questIds).subscribe();
  }

  private search(): void {
    this.questsService.searchQuests({
      title: this.searchTerm().trim() || null,
      category: this.toFilterValue(this.selectedCategory()),
      questType: 'FAMILY',
      age: null,
      type: this.toFilterValue(this.selectedActivityType()),
    });
  }

  private toFilterValue(value: string): string | null {
    return value === 'all' ? null : value;
  }
}
