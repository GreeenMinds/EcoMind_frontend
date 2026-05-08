import {NgStyle} from '@angular/common';
import {Component, EventEmitter, Input, Output, signal} from '@angular/core';

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
  imports: [NgStyle],
  templateUrl: './quest-category-selector.html',
  styleUrl: './quest-category-selector.css',
})
export class QuestCategorySelector {
  @Input({required: true}) categories: string[] = [];
  @Input({required: true}) selectedCategory = '';
  @Output() categorySelected = new EventEmitter<string>();

  readonly categoryMenuOpen = signal(false);

  readonly categoryConfig: Record<string, QuestCategoryConfig> = {
    energy: {
      label: 'Energy',
      iconUrl: '/assets/images/quests/light.png',
      iconFallback: '',
      iconSize: 44,
      backgroundColor: '#ffd34f',
      shadowColor: '#f0a13c',
    },
    water: {
      label: 'Water',
      iconUrl: '/assets/images/quests/water.png',
      iconFallback: 'Drop',
      iconSize: 40,
      backgroundColor: '#58a9ff',
      shadowColor: '#5468df',
    },
    recycle: {
      label: 'Recycle',
      iconUrl: '/assets/images/quests/recycle.png',
      iconFallback: 'Cycle',
      iconSize: 42,
      backgroundColor: '#68d474',
      shadowColor: '#3f9a55',
    },
    daily_quest: {
      label: 'Daily Quest',
      iconUrl: '/assets/images/quests/daily.png',
      iconFallback: 'Play',
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
    return (
      this.categoryConfig[category] ?? {
        label: category,
        iconUrl: '',
        iconFallback: '',
        iconSize: 36,
        backgroundColor: '#9aa3ad',
        shadowColor: '#707984',
      }
    );
  }

  getCategoryTheme(category: string): Record<string, string> {
    const config = this.getCategoryConfig(category);
    return {
      '--quest-bg': config.backgroundColor,
      '--quest-shadow': config.shadowColor,
    };
  }
}
