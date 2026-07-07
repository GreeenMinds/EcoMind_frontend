import { ChangeDetectorRef, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LearningService } from '../../../application/learning.service';
import { MaterialCard } from '../material-card/material-card';

@Component({
  selector: 'app-materials-list',
  imports: [TranslatePipe, MaterialCard],
  templateUrl: './materials-list.html',
  styleUrl: './materials-list.css',
})
export class MaterialsList {
  private readonly learningService = inject(LearningService);
  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  constructor() {
    this.translate.onLangChange.subscribe(() => this.cdr.markForCheck());
  }

  readonly materials = this.learningService.materials;
  readonly loading = this.learningService.loading;
  readonly error = this.learningService.error;

  readonly selectedCategory = signal<string>('');
  readonly selectedMaterialType = signal<string>('');

  readonly filteredMaterials = computed(() =>
    this.materials().filter((material) => {
      const matchesCategory =
        !this.selectedCategory() || material.category === this.selectedCategory();
      const matchesType =
        !this.selectedMaterialType() || material.materialType === this.selectedMaterialType();
      return matchesCategory && matchesType;
    }),
  );

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  selectMaterialType(type: string): void {
    this.selectedMaterialType.set(type);
  }

  onMaterialSelected(materialId: number): void {
    this.router.navigate(['/learning', 'materials', materialId]);
  }

  onFavoriteToggled(materialId: number): void {
    this.learningService.toggleFavorite(materialId);
  }
}
