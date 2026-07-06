import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, computed, inject } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LearningService } from '../../../application/learning.service';

@Component({
  selector: 'app-learning-history-section',
  imports: [DatePipe, TranslatePipe],
  templateUrl: './learning-history-section.html',
  styleUrl: './learning-history-section.css',
})
export class LearningHistorySection {
  private readonly learningService = inject(LearningService);
  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    this.translate.onLangChange.subscribe(() => this.cdr.markForCheck());
  }

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
