import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Friend } from '../../../domain/model/friend.entity';
import { User } from '../../../domain/model/user.entity';

export interface FriendProfileView {
  relationship: Friend;
  user: User;
  statusLabel: string;
  mutualCount: number;
}

@Component({
  selector: 'app-profile-friends-section',
  imports: [],
  templateUrl: './profile-friends-section.html',
  styleUrl: './profile-friends-section.css',
})
export class ProfileFriendsSection {
  @Input() friends: FriendProfileView[] = [];
  @Input() acceptedCount = 0;
  @Output() openFriend = new EventEmitter<FriendProfileView>();
  @Output() removeFriend = new EventEmitter<FriendProfileView>();

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

  buildHandle(user: User): string {
    const localPart = user.email.split('@')[0]?.trim().toLowerCase();
    if (localPart) {
      return `@${localPart}`;
    }

    return `@${user.name.replace(/\s+/g, '').toLowerCase()}`;
  }

  emitOpenFriend(friend: FriendProfileView): void {
    this.openFriend.emit(friend);
  }

  emitRemoveFriend(friend: FriendProfileView): void {
    this.removeFriend.emit(friend);
  }
}
