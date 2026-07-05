import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LearningService } from '../../../application/learning.service';

@Component({
  selector: 'app-learning-history-section',
  imports: [DatePipe, TranslatePipe],
  templateUrl: './learning-history-section.html',
  styleUrl: './learning-history-section.css',
})
export class LearningHistorySection {
  private readonly learningService = inject(LearningService);

  readonly reviews = this.learningService.reviews;
  readonly materials = this.learningService.materials;
  readonly loading = this.learningService.loading;
  readonly error = this.learningService.error;

  readonly reviewedMaterials = computed(() =>
    this.reviews().map((review) => {
      const material = this.materials().find((m) => m.id === review.materialId);
      return {
        review,
        material,
      };
    }).sort(
      (a, b) => new Date(b.review.reviewedAt).getTime() - new Date(a.review.reviewedAt).getTime()
    )
  );
}
