import { Component, Input, signal } from '@angular/core';
import { Quest } from '../../../../quests/domain/model/quest.entity';

export interface QuestProgressView {
  quest: Quest;
  progress: number;
  status: 'completed' | 'in_progress' | 'pending';
  dateLabel: string;
  activityCount: number;
}

@Component({
  selector: 'app-profile-progress-section',
  imports: [],
  templateUrl: './profile-progress-section.html',
  styleUrl: './profile-progress-section.css',
})
export class ProfileProgressSection {
  @Input() pending: QuestProgressView[] = [];
  @Input() completed: QuestProgressView[] = [];

  readonly showAllPending = signal(false);
  readonly showAllCompleted = signal(false);

  get visiblePending(): QuestProgressView[] {
    return this.showAllPending() ? this.pending : this.pending.slice(0, 4);
  }

  get visibleCompleted(): QuestProgressView[] {
    return this.showAllCompleted() ? this.completed : this.completed.slice(0, 4);
  }

  togglePending(): void {
    this.showAllPending.update((value) => !value);
  }

  toggleCompleted(): void {
    this.showAllCompleted.update((value) => !value);
  }

  getProgressPercent(progress: number): string {
    return `${Math.max(4, Math.min(progress, 100))}%`;
  }
}
