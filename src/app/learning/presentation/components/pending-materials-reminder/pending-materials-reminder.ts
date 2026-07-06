import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LearningService } from '../../../application/learning.service';

@Component({
  selector: 'app-pending-materials-reminder',
  imports: [TranslatePipe, RouterLink],
  templateUrl: './pending-materials-reminder.html',
  styleUrl: './pending-materials-reminder.css',
})
export class PendingMaterialsReminder {
  private readonly learningService = inject(LearningService);
  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    this.translate.onLangChange.subscribe(() => this.cdr.markForCheck());
  }

  readonly pendingCount = this.learningService.pendingCount;
}
