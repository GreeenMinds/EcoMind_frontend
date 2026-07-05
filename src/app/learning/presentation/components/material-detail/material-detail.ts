import { Component, computed, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';
import { LearningService } from '../../../application/learning.service';

@Component({
  selector: 'app-material-detail',
  imports: [TranslatePipe],
  templateUrl: './material-detail.html',
  styleUrl: './material-detail.css',
})
export class MaterialDetail implements OnInit {
  private readonly learningService = inject(LearningService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly materialId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('id')))),
    { initialValue: Number(this.route.snapshot.paramMap.get('id')) },
  );

  readonly material = computed(() => {
    const id = this.materialId();
    return Number.isFinite(id) ? this.learningService.getMaterialById(id)() : undefined;
  });

  ngOnInit(): void {
    const id = this.materialId();
    if (Number.isFinite(id)) {
      this.learningService.markAsReviewed(id);
    }
  }

  goBack(): void {
    void this.router.navigate(['/learning']);
  }

  toggleFavorite(): void {
    const id = this.materialId();
    if (Number.isFinite(id)) {
      this.learningService.toggleFavorite(id);
    }
  }

  isFavorite(): boolean {
    const id = this.materialId();
    return Number.isFinite(id) && this.learningService.favorites().some((fav) => fav.id === id);
  }

  getMaterialTypeLabel(): string {
    const material = this.material();
    if (!material) return '';
    const typeMap: Record<string, string> = {
      TEXT: 'learning.types.text',
      VIDEO: 'learning.types.video',
      INFOGRAPHIC: 'learning.types.infographic',
    };
    return typeMap[material.materialType] ?? material.materialType;
  }

  getCategoryLabel(): string {
    const material = this.material();
    if (!material) return '';
    const categoryMap: Record<string, string> = {
      RECYCLE: 'learning.categories.recycle',
      WATER: 'learning.categories.water',
      ENERGY: 'learning.categories.energy',
      ENVIRONMENT: 'learning.categories.environment',
    };
    return categoryMap[material.category] ?? material.category;
  }
}
