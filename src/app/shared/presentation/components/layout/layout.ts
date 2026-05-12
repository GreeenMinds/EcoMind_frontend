import { Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { ProfileService } from '../../../../profile/application/profile.service';
import { Sidebar } from '../sidebar/sidebar';
import { MonetizationStoreService } from '../../../../monetization/application/monetization-store.service';
import { ProfileAvatar } from '../../../../profile/presentation/components/profile-avatar/profile-avatar';

@Component({
  selector: 'app-layout',
  imports: [Sidebar, RouterOutlet, ProfileAvatar],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  private readonly profileService = inject(ProfileService);
  readonly monetizationStore = inject(MonetizationStoreService);
  readonly currentUser = this.profileService.currentUserProfile;

  /** URL del avatar equipado (tipo 'avatar'), o null si solo tiene iniciales */
  readonly equippedAvatarUrl = computed(() => {
    const equipped = this.monetizationStore.cosmeticSummaries().find(
      (s) => s.equipped && s.cosmetic.type === 'avatar'
    );
    return equipped?.cosmetic.imageUrl ?? null;
  });

  readonly equippedOverlayUrl = computed(() => {
    const overlay = this.monetizationStore.cosmeticSummaries().find(
      (s) => s.equipped && s.cosmetic.type !== 'avatar'
    );
    return overlay?.cosmetic.imageUrl ?? null;
  });

  readonly equippedOverlayType = computed(() => {
    const overlay = this.monetizationStore.cosmeticSummaries().find(
      (s) => s.equipped && s.cosmetic.type !== 'avatar'
    );
    return overlay?.cosmetic.type ?? null;
  });

  constructor() {
    this.profileService.refreshCurrentUser().pipe(takeUntilDestroyed()).subscribe();
  }
}
