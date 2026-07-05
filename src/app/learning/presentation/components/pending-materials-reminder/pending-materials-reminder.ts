import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LearningService } from '../../../application/learning.service';

@Component({
  selector: 'app-pending-materials-reminder',
  imports: [TranslatePipe, RouterLink],
  templateUrl: './pending-materials-reminder.html',
  styleUrl: './pending-materials-reminder.css',
})
export class PendingMaterialsReminder {
  private readonly learningService = inject(LearningService);

  readonly pendingCount = this.learningService.pendingCount;
}
