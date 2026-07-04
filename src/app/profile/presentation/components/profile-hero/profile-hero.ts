import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { User } from '../../../domain/model/user.entity';
import { ProfileAvatar } from '../profile-avatar/profile-avatar';

@Component({
  selector: 'app-profile-hero',
  imports: [ProfileAvatar, TranslatePipe],
  templateUrl: './profile-hero.html',
  styleUrl: './profile-hero.css',
})
export class ProfileHero {
  @Input() user: User | null = null;
  @Input() handle = '';
  @Input() friendCount = 0;
  @Input() isViewingOwnProfile = true;
  @Input() saving = false;
  @Input() equippedAvatarUrl: string | null = null;
  @Input() equippedOverlayUrl: string | null = null;
  @Input() equippedOverlayType: string | null = null;
  @Input() removeActionLabel = 'Eliminar';
  @Input() showRemoveAction = true;

  @Output() editProfile = new EventEmitter<void>();
  @Output() shareProfile = new EventEmitter<void>();
  @Output() removeMember = new EventEmitter<void>();
}
