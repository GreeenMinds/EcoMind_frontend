import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Friend } from '../../../domain/model/friend.entity';
import { User } from '../../../domain/model/user.entity';
import { ProfileAvatar } from '../profile-avatar/profile-avatar';

export interface FriendProfileView {
  relationship: Friend;
  user: User;
  statusLabel: string;
  mutualCount: number;
  equippedAvatarUrl: string | null;
  equippedOverlayUrl: string | null;
  equippedOverlayType: string | null;
}

export interface FriendInviteCandidateView {
  user: User;
  disabledReason: string | null;
  equippedAvatarUrl: string | null;
  equippedOverlayUrl: string | null;
  equippedOverlayType: string | null;
}

@Component({
  selector: 'app-profile-friends-section',
  imports: [ProfileAvatar],
  templateUrl: './profile-friends-section.html',
  styleUrl: './profile-friends-section.css',
})
export class ProfileFriendsSection {
  @Input() friends: FriendProfileView[] = [];
  @Input() acceptedCount = 0;
  @Input() inviteCandidates: FriendInviteCandidateView[] = [];
  @Output() openFriend = new EventEmitter<FriendProfileView>();
  @Output() removeFriend = new EventEmitter<FriendProfileView>();
  @Output() sendFriendRequest = new EventEmitter<number>();

  friendInviteSearch = '';

  updateFriendInviteSearch(value: string): void {
    this.friendInviteSearch = value;
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

  emitFriendRequest(candidate: FriendInviteCandidateView): void {
    if (candidate.disabledReason) {
      return;
    }

    this.sendFriendRequest.emit(candidate.user.id);
  }

  get filteredInviteCandidates(): FriendInviteCandidateView[] {
    const normalizedQuery = this.friendInviteSearch.trim().toLowerCase();
    if (!normalizedQuery) {
      return [];
    }

    return [...this.inviteCandidates]
      .filter((candidate) => candidate.user.name.toLowerCase().includes(normalizedQuery))
      .sort((left, right) => {
        const leftName = left.user.name.toLowerCase();
        const rightName = right.user.name.toLowerCase();
        const leftExact = leftName === normalizedQuery ? 1 : 0;
        const rightExact = rightName === normalizedQuery ? 1 : 0;
        if (leftExact !== rightExact) {
          return rightExact - leftExact;
        }

        const leftStartsWith = leftName.startsWith(normalizedQuery) ? 1 : 0;
        const rightStartsWith = rightName.startsWith(normalizedQuery) ? 1 : 0;
        if (leftStartsWith !== rightStartsWith) {
          return rightStartsWith - leftStartsWith;
        }

        return left.user.name.localeCompare(right.user.name);
      });
  }
}
