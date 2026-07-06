import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LearningService } from '../../../application/learning.service';
import { MaterialsList } from '../materials-list/materials-list';
import { FavoritesSection } from '../favorites-section/favorites-section';
import { LearningHistorySection } from '../learning-history-section/learning-history-section';

@Component({
  selector: 'app-learning-content',
  imports: [RouterOutlet, TranslatePipe, MaterialsList, FavoritesSection, LearningHistorySection],
  templateUrl: './learning-content.html',
  styleUrl: './learning-content.css',
})
export class LearningContent {
  private readonly learningService = inject(LearningService);
  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    this.translate.onLangChange.subscribe(() => this.cdr.markForCheck());
  }

  readonly selectedTab = signal<'materials' | 'favorites' | 'history'>('materials');

  readonly pendingCount = this.learningService.pendingCount;
}
