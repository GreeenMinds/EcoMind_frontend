import { ChangeDetectorRef, Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
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
  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly langVersion = signal(0);

  constructor() {
    this.translate.onLangChange.subscribe(() => {
      this.langVersion.update(v => v + 1);
      this.cdr.markForCheck();
    });
  }

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
      TEXT: 'learning.filters.text',
      VIDEO: 'learning.filters.video',
      INFOGRAPHIC: 'learning.filters.infographic',
    };
    return typeMap[material.materialType] ?? material.materialType;
  }

  getCategoryLabel(): string {
    const material = this.material();
    if (!material) return '';
    const categoryMap: Record<string, string> = {
      RECYCLE: 'learning.filters.recycle',
      WATER: 'learning.filters.water',
      ENERGY: 'learning.filters.energy',
      ENVIRONMENT: 'learning.filters.environment',
    };
    return categoryMap[material.category] ?? material.category;
  }
}
