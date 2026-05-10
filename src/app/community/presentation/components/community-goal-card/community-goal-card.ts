import { Component, Input } from '@angular/core';
import { CommunityGoal } from '../../../domain/model/community-goal.entity';

@Component({
  selector: 'app-community-goal-card',
  imports: [],
  templateUrl: './community-goal-card.html',
  styleUrl: './community-goal-card.css',
})
export class CommunityGoalCard {
  @Input() goal?: CommunityGoal;

  get progressPercent(): number {
    if (!this.goal || this.goal.target === 0) return 0;
    return Math.min(100, Math.round((this.goal.progress / this.goal.target) * 100));
  }
}
