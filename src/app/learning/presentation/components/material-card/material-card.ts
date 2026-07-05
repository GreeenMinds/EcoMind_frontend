import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { EducationalMaterial } from '../../../domain/model/educational-material.entity';

@Component({
  selector: 'app-material-card',
  imports: [TranslatePipe],
  templateUrl: './material-card.html',
  styleUrl: './material-card.css',
})
export class MaterialCard {
  @Input({ required: true }) material!: EducationalMaterial;
  @Output() favoriteToggled = new EventEmitter<number>();
  @Output() materialSelected = new EventEmitter<number>();

  selectMaterial(): void {
    this.materialSelected.emit(this.material.id);
  }

  toggleFavorite(event: Event): void {
    event.stopPropagation();
    this.favoriteToggled.emit(this.material.id);
  }

  getMaterialTypeLabel(): string {
    const typeMap: Record<string, string> = {
      TEXT: 'learning.filters.text',
      VIDEO: 'learning.filters.video',
      INFOGRAPHIC: 'learning.filters.infographic',
    };
    return typeMap[this.material.materialType] ?? this.material.materialType;
  }

  getCategoryLabel(): string {
    const categoryMap: Record<string, string> = {
      RECYCLE: 'learning.filters.recycle',
      WATER: 'learning.filters.water',
      ENERGY: 'learning.filters.energy',
      ENVIRONMENT: 'learning.filters.environment',
    };
    return categoryMap[this.material.category] ?? this.material.category;
  }
}
