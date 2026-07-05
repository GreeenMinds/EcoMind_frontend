import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LearningService } from '../../application/learning.service';
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

  readonly selectedTab = signal<'materials' | 'favorites' | 'history'>('materials');

  readonly pendingCount = this.learningService.pendingCount;
}
