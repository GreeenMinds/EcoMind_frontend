import {Component, inject} from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import {QuestProgressPanel} from '../quest-progress-panel/quest-progress-panel';

@Component({
  selector: 'app-quests-content',
  imports: [QuestProgressPanel, RouterOutlet],
  templateUrl: './quests-content.html',
  styleUrl: './quests-content.css',
})
export class QuestsContent {
  private readonly router = inject(Router);

  readonly streakPlaceholder = 16;
  readonly rankingPlaceholder = 220;

  showQuestSummaryPanel(): boolean {
    const currentPath = this.router.url.split(/[?#]/)[0];
    return currentPath === '/quests' || currentPath === '/quests/';
  }
}
