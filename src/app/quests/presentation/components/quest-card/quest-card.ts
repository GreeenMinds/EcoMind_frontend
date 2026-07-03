import { NgStyle } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Quest } from '../../../domain/model/quest.entity';
import { getQuestDisplayType, getQuestTypeIcon, getQuestTypeTheme } from '../../quest-visuals';

@Component({
  selector: 'app-quest-card',
  imports: [NgStyle, TranslatePipe],
  templateUrl: './quest-card.html',
  styleUrl: './quest-card.css',
})
export class QuestCard {
  @Input({ required: true }) quest!: Quest;
  @Output() questSelected = new EventEmitter<number>();

  selectQuest(): void {
    this.questSelected.emit(this.quest.id);
  }

  getDisplayType(): string {
    return getQuestDisplayType(this.quest.type, this.quest.theme_type);
  }

  getQuestTypeTheme(type: string): Record<string, string> {
    return getQuestTypeTheme(type);
  }

  getQuestTypeIcon(type: string): string {
    return getQuestTypeIcon(type);
  }
}
