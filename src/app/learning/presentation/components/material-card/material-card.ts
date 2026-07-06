import { ChangeDetectorRef, Component, computed, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { EducationalMaterial } from '../../../domain/model/educational-material.entity';

@Component({
  selector: 'app-material-card',
  imports: [TranslatePipe],
  templateUrl: './material-card.html',
  styleUrl: './material-card.css',
})
export class MaterialCard {
  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly langVersion = signal(0);

  @Input({ required: true }) material!: EducationalMaterial;
  @Output() favoriteToggled = new EventEmitter<number>();
  @Output() materialSelected = new EventEmitter<number>();

  readonly imageLoaded = signal(true);
  readonly placeholderIcon = computed(() => {
    this.langVersion();
    return this.getCategoryIcon();
  });

  constructor() {
    this.translate.onLangChange.subscribe(() => {
      this.langVersion.update(v => v + 1);
      this.cdr.markForCheck();
    });
  }

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

  private getCategoryIcon(): string {
    const iconMap: Record<string, string> = {
      RECYCLE: '♻️',
      WATER: '💧',
      ENERGY: '🔋',
      ENVIRONMENT: '🌍',
    };
    return iconMap[this.material?.category] ?? '🌿';
  }
}
