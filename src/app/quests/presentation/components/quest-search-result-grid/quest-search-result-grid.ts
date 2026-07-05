import { Component, EventEmitter, input, Output } from '@angular/core';
import { Quest } from '../../../domain/model/quest.entity';
import { QuestSearchResultCard } from '../quest-search-result-card/quest-search-result-card';

@Component({
  selector: 'app-quest-search-result-grid',
  imports: [QuestSearchResultCard],
  templateUrl: './quest-search-result-grid.html',
  styleUrl: './quest-search-result-grid.css',
})
export class QuestSearchResultGrid {
  readonly quests = input.required<Quest[]>();
  @Output() questAction = new EventEmitter<Quest>();

  selectQuest(quest: Quest): void {
    this.questAction.emit(quest);
  }
}
