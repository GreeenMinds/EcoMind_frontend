import {NgStyle} from '@angular/common';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';
import {QuestSummary} from '../../../application/quests.service';

@Component({
  selector: 'app-quest-card',
  imports: [NgStyle, TranslatePipe],
  templateUrl: './quest-card.html',
  styleUrl: './quest-card.css',
})
export class QuestCard {
  @Input({required: true}) summary!: QuestSummary;
  @Output() questSelected = new EventEmitter<number>();

  selectQuest(): void {
    this.questSelected.emit(this.summary.quest.id);
  }

  getDisplayType(): string {
    return this.summary.quest.type === 'collaborative' ? 'collaborative' : this.summary.themeType;
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
      collaborative: '/assets/images/quests/colab.png',
    };

    return icons[type] ?? '/assets/images/quests/checkbox.png';
  }
}
