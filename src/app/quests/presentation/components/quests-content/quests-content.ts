import {Component, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {Router, RouterOutlet} from '@angular/router';
import {TranslatePipe} from '@ngx-translate/core';
import {ProfileService} from '../../../../profile/application/profile.service';
import {QuestProgressPanel} from '../quest-progress-panel/quest-progress-panel';

@Component({
  selector: 'app-quests-content',
  imports: [QuestProgressPanel, RouterOutlet, TranslatePipe],
  templateUrl: './quests-content.html',
  styleUrl: './quests-content.css',
})
export class QuestsContent {
  private readonly router = inject(Router);
  private readonly profileService = inject(ProfileService);

  readonly userStreak = toSignal(this.profileService.getUserStreak(), {initialValue: 0});
  readonly rankingPlaceholder = 220;

  showQuestSummaryPanel(): boolean {
    const currentPath = this.router.url.split(/[?#]/)[0];
    return currentPath === '/quests' || currentPath === '/quests/';
  }
}
