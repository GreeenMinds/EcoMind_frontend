import {NgStyle} from '@angular/common';
import {Component, EventEmitter, Input, Output, inject, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';

interface QuestCategoryConfig {
  label: string;
  iconUrl: string;
  iconFallback: string;
  iconSize: number;
  backgroundColor: string;
  shadowColor: string;
}

@Component({
  selector: 'app-quest-category-selector',
  imports: [NgStyle, RouterLink, TranslatePipe],
  templateUrl: './quest-category-selector.html',
  styleUrl: './quest-category-selector.css',
})
export class QuestCategorySelector {
  private readonly translate = inject(TranslateService);

  @Input({required: true}) categories: string[] = [];
  @Input({required: true}) selectedCategory = '';
  @Output() categorySelected = new EventEmitter<string>();

  readonly categoryMenuOpen = signal(false);

  readonly categoryConfig: Record<string, QuestCategoryConfig> = {
    energy: {
      label: 'energy',
      iconUrl: '/assets/images/quests/light.png',
      iconFallback: '',
      iconSize: 44,
      backgroundColor: '#ffd34f',
      shadowColor: '#f0a13c',
    },
    water: {
      label: 'water',
      iconUrl: '/assets/images/quests/water.png',
      iconFallback: '',
      iconSize: 40,
      backgroundColor: '#58a9ff',
      shadowColor: '#5468df',
    },
    recycle: {
      label: 'recycle',
      iconUrl: '/assets/images/quests/recycle.png',
      iconFallback: '',
      iconSize: 42,
      backgroundColor: '#68d474',
      shadowColor: '#3f9a55',
    },
    daily_quest: {
      label: 'daily_quest',
      iconUrl: '/assets/images/quests/daily.png',
      iconFallback: '',
      iconSize: 38,
      backgroundColor: '#ff533b',
      shadowColor: '#d43023',
    },
  };

  selectCategory(category: string): void {
    this.categorySelected.emit(category);
    this.categoryMenuOpen.set(false);
  }

  toggleCategoryMenu(): void {
    this.categoryMenuOpen.update((open) => !open);
  }

  closeCategoryMenu(): void {
    this.categoryMenuOpen.set(false);
  }

  getCategoryConfig(category: string): QuestCategoryConfig {
    const config =
      this.categoryConfig[category] ?? {
        label: category,
        iconUrl: '',
        iconFallback: '',
        iconSize: 36,
        backgroundColor: '#9aa3ad',
        shadowColor: '#707984',
      };
    const translationKey = `quests.categories.${category}`;
    const translatedLabel = this.translate.instant(translationKey);

    return {
      ...config,
      label: translatedLabel === translationKey ? config.label : translatedLabel,
    };
  }

  getCategoryTheme(category: string): Record<string, string> {
    const config = this.getCategoryConfig(category);
    return {
      '--quest-bg': config.backgroundColor,
      '--quest-shadow': config.shadowColor,
    };
  }
}
