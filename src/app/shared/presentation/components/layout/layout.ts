import { Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { ProfileService } from '../../../../profile/application/profile.service';
import { Sidebar } from '../sidebar/sidebar';
import { MonetizationStoreService } from '../../../../monetization/application/monetization-store.service';

@Component({
  selector: 'app-layout',
  imports: [Sidebar, RouterOutlet,],
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

  constructor() {
    this.profileService.refreshCurrentUser().pipe(takeUntilDestroyed()).subscribe();
  }


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
