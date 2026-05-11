import { Component, computed, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../domain/model/user.entity';
import { MonetizationStoreService } from '../../../../monetization/application/monetization-store.service';

@Component({
  selector: 'app-profile-hero',
  imports: [CommonModule],
  templateUrl: './profile-hero.html',
  styleUrl: './profile-hero.css',
})
export class ProfileHero {
  @Input() user: User | null = null;
  @Input() handle = '';
  @Input() friendCount = 0;
  @Input() isViewingOwnProfile = true;
  @Input() saving = false;

  @Output() editProfile = new EventEmitter<void>();
  @Output() shareProfile = new EventEmitter<void>();
  @Output() removeMember = new EventEmitter<void>();

  private readonly monetizationSvc = inject(MonetizationStoreService);

  /** URL of the equipped avatar cosmetic (type === 'avatar'), or null */
  readonly equippedAvatarUrl = computed(() => {
    const equipped = this.monetizationSvc.cosmeticSummaries().find(
      (s) => s.equipped && s.cosmetic.type === 'avatar'
    );
    return equipped?.cosmetic.imageUrl ?? null;
  });

  /** URL of the equipped overlay cosmetic (hat, cosmetic, etc.), or null */
  readonly equippedOverlayUrl = computed(() => {
    const overlay = this.monetizationSvc.cosmeticSummaries().find(
      (s) => s.equipped && s.cosmetic.type !== 'avatar'
    );
    return overlay?.cosmetic.imageUrl ?? null;
  });

  readonly equippedOverlayType = computed(() => {
    const overlay = this.monetizationSvc.cosmeticSummaries().find(
      (s) => s.equipped && s.cosmetic.type !== 'avatar'
    );

    return overlay?.cosmetic.type ?? null;
  });
  getInitials(name: string | undefined): string {
    if (!name) {
      return 'EM';
    }

    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  getAvatarHue(userId: number | undefined): string {
    const safeId = userId ?? 1;
    return `${(safeId * 67) % 360}`;
  }
}
