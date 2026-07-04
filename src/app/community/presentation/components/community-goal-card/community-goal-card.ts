import { Component, Input, OnChanges } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CommunityGoal } from '../../../domain/model/community-goal.entity';

@Component({
  selector: 'app-community-goal-card',
  imports: [TranslatePipe],
  templateUrl: './community-goal-card.html',
  styleUrl: './community-goal-card.css',
})
export class CommunityGoalCard implements OnChanges {
  @Input() goals: CommunityGoal[] = [];

  currentIndex = 0;

  ngOnChanges(): void {
    if (this.currentIndex >= this.goals.length) {
      this.currentIndex = 0;
    }
  }

  get goal(): CommunityGoal | undefined {
    return this.goals[this.currentIndex];
  }

  get hasMultipleGoals(): boolean {
    return this.goals.length > 1;
  }

  get progressPercent(): number {
    if (!this.goal || this.goal.target === 0) return 0;
    return Math.min(100, Math.round((this.goal.progress / this.goal.target) * 100));
  }

  showPreviousGoal(): void {
    if (!this.hasMultipleGoals) return;

    this.currentIndex = this.currentIndex === 0 ? this.goals.length - 1 : this.currentIndex - 1;
  }

  showNextGoal(): void {
    if (!this.hasMultipleGoals) return;

    this.currentIndex = this.currentIndex === this.goals.length - 1 ? 0 : this.currentIndex + 1;
  }
}
