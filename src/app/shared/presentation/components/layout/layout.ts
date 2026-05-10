import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { ProfileService } from '../../../../profile/application/profile.service';
import { Sidebar } from '../sidebar/sidebar';
import { MonetizationStoreService } from '../../../../monetization/application/monetization-store.service';

@Component({
  selector: 'app-layout',
  imports: [Sidebar, RouterOutlet],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  private readonly profileService = inject(ProfileService);
  readonly monetizationStore = inject(MonetizationStoreService);
  readonly currentUser = this.profileService.currentUserProfile;

  constructor() {
    this.profileService.refreshCurrentUser().pipe(takeUntilDestroyed()).subscribe();
  }
}
