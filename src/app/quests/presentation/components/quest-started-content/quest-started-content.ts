import {Component, OnDestroy, OnInit, inject} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'app-quest-started-content',
  imports: [TranslatePipe],
  templateUrl: './quest-started-content.html',
  styleUrl: './quest-started-content.css',
})
export class QuestStartedContent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private redirectTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly imageSrc = '/assets/images/quests/activity-started.png';

  ngOnInit(): void {
    const questId = Number(this.route.snapshot.paramMap.get('questId'));
    this.redirectTimeout = setTimeout(() => {
      if (Number.isFinite(questId)) {
        void this.router.navigate(['/quests', questId, 'activities']);
      }
    }, 1500);
  }

  ngOnDestroy(): void {
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout);
    }
  }
}
