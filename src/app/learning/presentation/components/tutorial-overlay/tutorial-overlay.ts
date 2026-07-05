import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LearningService } from '../../../application/learning.service';

@Component({
  selector: 'app-tutorial-overlay',
  imports: [TranslatePipe],
  templateUrl: './tutorial-overlay.html',
  styleUrl: './tutorial-overlay.css',
})
export class TutorialOverlay {
  private readonly learningService = inject(LearningService);

  @Input({ required: true }) visible = false;
  @Output() nextStep = new EventEmitter<number>();
  @Output() skipTutorial = new EventEmitter<void>();
  @Output() completeTutorial = new EventEmitter<void>();

  readonly currentStep = signal(1);
  readonly totalSteps = 7;

  readonly isLastStep = computed(() => this.currentStep() === this.totalSteps);

  onNext(): void {
    if (this.isLastStep()) {
      this.completeTutorial.emit();
      return;
    }
    const next = this.currentStep() + 1;
    this.currentStep.set(next);
    this.nextStep.emit(next);
  }

  onSkip(): void {
    this.skipTutorial.emit();
  }

  onStart(): void {
    this.completeTutorial.emit();
  }
}
