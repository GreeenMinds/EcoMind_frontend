import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Family } from '../../../domain/model/family.entity';
import { FamilyUser } from '../../../domain/model/family-user.entity';
import { User } from '../../../domain/model/user.entity';
import { ProfileAvatar } from '../profile-avatar/profile-avatar';

export interface FamilyMemberView {
  user: User;
  membership: FamilyUser;
  equippedAvatarUrl: string | null;
  equippedOverlayUrl: string | null;
  equippedOverlayType: string | null;
}

export type FamilyRole = 'parent' | 'child';

export interface FamilyInvitePayload {
  userId: number;
  role: FamilyRole;
}

export interface FamilyInvitationInboxView {
  id: number;
  familyName: string;
  inviterName: string;
  role: FamilyRole;
  createdAtLabel: string;
}

export interface FamilyInvitationOutboxView {
  id: number;
  familyName: string;
  invitedName: string;
  role: FamilyRole;
  createdAtLabel: string;
}

export interface FamilyInviteCandidateView {
  user: User;
  disabledReason: string | null;
  equippedAvatarUrl: string | null;
  equippedOverlayUrl: string | null;
  equippedOverlayType: string | null;
}

@Component({
  selector: 'app-profile-family-section',
  imports: [ProfileAvatar],
  templateUrl: './profile-family-section.html',
  styleUrl: './profile-family-section.css',
})
export class ProfileFamilySection {
  @Input() family: Family | null = null;
  @Input() familySummary = '';
  @Input() familyCommitment: string | null = null;
  @Input() members: FamilyMemberView[] = [];
  @Input() canManageFamily = false;
  @Input() canCreateFamily = false;
  @Input() canLeaveFamily = false;
  @Input() inviteCandidates: FamilyInviteCandidateView[] = [];
  @Input() noFamilyMessage = 'No estas inscrito o incluido en una familia.';
  @Input() incomingInvitations: FamilyInvitationInboxView[] = [];
  @Input() outgoingInvitations: FamilyInvitationOutboxView[] = [];

  @Output() editCommitment = new EventEmitter<void>();
  @Output() openMember = new EventEmitter<FamilyMemberView>();
  @Output() inviteMember = new EventEmitter<FamilyInvitePayload>();
  @Output() createFamily = new EventEmitter<string>();
  @Output() acceptInvitation = new EventEmitter<number>();
  @Output() rejectInvitation = new EventEmitter<number>();
  @Output() leaveFamily = new EventEmitter<void>();

  familyInviteSearch = '';
  inviteRole: FamilyRole = 'child';

  getRoleLabel(role: string): string {
    const normalizedRole = role.trim().toLowerCase();
    if (normalizedRole === 'parent' || normalizedRole === 'padre/madre') {
      return 'Padre/Madre';
    }
    if (normalizedRole === 'child' || normalizedRole === 'hijo/hija') {
      return 'Hijo/Hija';
    }
    return role;
  }

  updateFamilyInviteSearch(value: string): void {
    this.familyInviteSearch = value;
  }

  updateInviteRole(role: string): void {
    if (role === 'parent' || role === 'child') {
      this.inviteRole = role;
    }
  }

  get filteredInviteCandidates(): FamilyInviteCandidateView[] {
    const normalizedQuery = this.familyInviteSearch.trim().toLowerCase();
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

  emitInvite(candidate: FamilyInviteCandidateView): void {
    if (candidate.disabledReason) {
      return;
    }

    this.inviteMember.emit({
      userId: candidate.user.id,
      role: this.inviteRole,
    });
  }

  emitCreateFamily(familyName: string): void {
    const trimmedName = familyName.trim();
    if (!trimmedName) {
      return;
    }

    this.createFamily.emit(trimmedName);
  }
}
