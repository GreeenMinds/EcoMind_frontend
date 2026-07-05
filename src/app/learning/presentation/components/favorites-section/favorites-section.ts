import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LearningService } from '../../../application/learning.service';

@Component({
  selector: 'app-favorites-section',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './favorites-section.html',
  styleUrl: './favorites-section.css',
})
export class FavoritesSection {
  private readonly learningService = inject(LearningService);

  readonly favorites = this.learningService.favorites;
  readonly loading = this.learningService.loading;
  readonly error = this.learningService.error;
}
