import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { ProfileService } from '../../../../profile/application/profile.service';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-layout',
  imports: [Sidebar, RouterOutlet],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  private readonly profileService = inject(ProfileService);

  readonly currentUser = this.profileService.currentUserProfile;

  constructor() {
    this.profileService.refreshCurrentUser().pipe(takeUntilDestroyed()).subscribe();
  }
}
