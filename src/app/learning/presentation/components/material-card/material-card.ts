import { NgStyle } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { EducationalMaterial } from '../../../domain/model/educational-material.entity';

@Component({
  selector: 'app-material-card',
  imports: [TranslatePipe, NgStyle],
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
      TEXT: 'learning.types.text',
      VIDEO: 'learning.types.video',
      INFOGRAPHIC: 'learning.types.infographic',
    };
    return typeMap[this.material.materialType] ?? this.material.materialType;
  }

  getCategoryLabel(): string {
    const categoryMap: Record<string, string> = {
      RECYCLE: 'learning.categories.recycle',
      WATER: 'learning.categories.water',
      ENERGY: 'learning.categories.energy',
      ENVIRONMENT: 'learning.categories.environment',
    };
    return categoryMap[this.material.category] ?? this.material.category;
  }
}
