import { Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LearningService } from '../../application/learning.service';
import { MaterialCard } from '../material-card/material-card';

@Component({
  selector: 'app-materials-list',
  imports: [TranslatePipe, MaterialCard],
  templateUrl: './materials-list.html',
  styleUrl: './materials-list.css',
})
export class MaterialsList {
  private readonly learningService = inject(LearningService);

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
    this.learningService.getMaterialById(materialId);
  }

  onFavoriteToggled(materialId: number): void {
    this.learningService.toggleFavorite(materialId);
  }
}
