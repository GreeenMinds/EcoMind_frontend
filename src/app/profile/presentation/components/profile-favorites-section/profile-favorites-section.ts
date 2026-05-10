import { Component, Input, signal } from '@angular/core';

export type FavoriteCategory = 'all' | 'event' | 'post' | 'quest';

export interface FavoriteItemView {
  id: string;
  category: Exclude<FavoriteCategory, 'all'>;
  title: string;
  description: string;
  imageUrl: string | null;
  eyebrow: string;
  meta: string;
}

@Component({
  selector: 'app-profile-favorites-section',
  imports: [],
  templateUrl: './profile-favorites-section.html',
  styleUrl: './profile-favorites-section.css',
})
export class ProfileFavoritesSection {
  @Input() items: FavoriteItemView[] = [];

  readonly selectedCategory = signal<FavoriteCategory>('all');

  selectCategory(category: FavoriteCategory): void {
    this.selectedCategory.set(category);
  }

  get filteredItems(): FavoriteItemView[] {
    const category = this.selectedCategory();
    if (category === 'all') {
      return this.items;
    }

    return this.items.filter((item) => item.category === category);
  }

  getFavoriteTone(item: FavoriteItemView): string {
    const toneMap: Record<FavoriteItemView['category'], string> = {
      event: 'forest',
      post: 'ocean',
      quest: 'sun',
    };

    return toneMap[item.category];
  }
}
