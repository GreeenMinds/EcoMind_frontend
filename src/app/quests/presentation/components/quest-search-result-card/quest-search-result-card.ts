import { Component, computed, EventEmitter, inject, input, Output } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Quest } from '../../../domain/model/quest.entity';
import { getQuestDisplayType, getQuestTypeIcon, getQuestTypeTheme } from '../../quest-visuals';

@Component({
  selector: 'app-quest-search-result-card',
  imports: [TranslatePipe],
  templateUrl: './quest-search-result-card.html',
  styleUrl: './quest-search-result-card.css',
})
export class QuestSearchResultCard {
  readonly quest = input.required<Quest>();
  @Output() questAction = new EventEmitter<Quest>();

  private readonly translate = inject(TranslateService);

  readonly categoryClass = computed(() => this.quest().category.toLowerCase());
  readonly categoryLabel = computed(() => this.getCategoryLabel(this.quest().category));
  readonly questTypeLabel = computed(() => this.getQuestTypeLabel(this.quest().type));
  readonly ageLabel = computed(() =>
    this.quest().age > 0
      ? this.translate.instant('common.yearsPlus', { count: this.quest().age })
      : null,
  );
  readonly ecoPointsLabel = computed(() =>
    this.quest().reward_ecopoints > 0
      ? this.translate.instant('common.ecoPoints', { count: this.quest().reward_ecopoints })
      : null,
  );
  readonly actionLabel = computed(() => {
    const quest = this.quest();
    if (quest.completed) {
      return this.translate.instant('quests.actions.startAgain');
    }
    if (quest.started) {
      return this.translate.instant(
        quest.type === 'ACTIVITIES' ? 'quests.actions.viewActivity' : 'quests.actions.viewQuest',
      );
    }
    return this.translate.instant('quests.actions.start');
  });
  readonly displayType = computed(() =>
    getQuestDisplayType(this.quest().type, this.quest().theme_type),
  );
  readonly theme = computed(() => getQuestTypeTheme(this.displayType()));
  readonly icon = computed(() => getQuestTypeIcon(this.displayType()));

  selectQuest(): void {
    this.questAction.emit(this.quest());
  }

  private getCategoryLabel(category: string): string {
    const key = `quests.categories.${category.toLowerCase()}`;
    const translated = this.translate.instant(key);
    return translated === key ? category.toLowerCase().replaceAll('_', ' ') : translated;
  }

  private getQuestTypeLabel(type: string): string {
    const key = `quests.types.${type.toLowerCase()}`;
    const translated = this.translate.instant(key);
    return translated === key ? type : translated;
  }
}
