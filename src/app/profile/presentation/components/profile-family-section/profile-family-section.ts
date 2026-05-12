import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Family } from '../../../domain/model/family.entity';
import { FamilyUser } from '../../../domain/model/family-user.entity';
import { User } from '../../../domain/model/user.entity';

export interface FamilyMemberView {
  user: User;
  membership: FamilyUser;
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

@Component({
  selector: 'app-profile-family-section',
  imports: [],
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
  @Input() inviteCandidates: User[] = [];
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

  emitInvite(userId: string, role: string): void {
    const parsedUserId = Number(userId);
    if (!parsedUserId || (role !== 'parent' && role !== 'child')) {
      return;
    }

    this.inviteMember.emit({
      userId: parsedUserId,
      role: role as FamilyRole,
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
