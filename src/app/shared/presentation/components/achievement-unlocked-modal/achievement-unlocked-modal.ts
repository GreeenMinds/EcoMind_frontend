import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-achievement-unlocked-modal',
  imports: [],
  templateUrl: './achievement-unlocked-modal.html',
  styleUrl: './achievement-unlocked-modal.css',
})
export class AchievementUnlockedModal {
  @Input() achievementName = '';
  @Output() continue = new EventEmitter<void>();
}
