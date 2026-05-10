import { Component, EventEmitter, Input, Output } from '@angular/core';
import { User } from '../../../domain/model/user.entity';

@Component({
  selector: 'app-profile-hero',
  imports: [],
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
