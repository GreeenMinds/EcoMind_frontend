import { Component, Input, OnChanges, signal } from '@angular/core';

@Component({
  selector: 'app-profile-avatar',
  imports: [],
  templateUrl: './profile-avatar.html',
  styleUrl: './profile-avatar.css',
})
export class ProfileAvatar implements OnChanges {
  @Input() name = '';
  @Input() userId: number | null = null;
  @Input() size: 'hero' | 'member' | 'header' = 'member';
  @Input() avatarUrl: string | null = null;
  @Input() overlayUrl: string | null = null;
  @Input() overlayType: string | null = null;

  readonly showAvatarImage = signal(true);
  readonly showOverlayImage = signal(true);

  ngOnChanges(): void {
    this.showAvatarImage.set(true);
    this.showOverlayImage.set(true);
  }

  getInitials(name: string | undefined): string {
    if (!name) {
      return '--';
    }

    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  getAvatarHue(userId: number | null): string {
    const safeId = userId ?? 1;
    return `${(safeId * 67) % 360}`;
  }

  hideAvatarImage(): void {
    this.showAvatarImage.set(false);
  }

  hideOverlayImage(): void {
    this.showOverlayImage.set(false);
  }
}
