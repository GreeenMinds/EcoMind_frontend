import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Family } from '../../../domain/model/family.entity';
import { FamilyUser } from '../../../domain/model/family-user.entity';
import { User } from '../../../domain/model/user.entity';

export interface FamilyMemberView {
  user: User;
  membership: FamilyUser;
}

export interface FamilyInvitePayload {
  userId: number;
  role: string;
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
  @Input() inviteCandidates: User[] = [];

  @Output() editCommitment = new EventEmitter<void>();
  @Output() openMember = new EventEmitter<FamilyMemberView>();
  @Output() inviteMember = new EventEmitter<FamilyInvitePayload>();

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
    const roleMap: Record<string, string> = {
      parent: 'Padre/Madre',
      child: 'Hijo/Hija',
    };

    return roleMap[role] ?? role;
  }

  emitInvite(userId: string, role: string): void {
    const parsedUserId = Number(userId);
    if (!parsedUserId || !role) {
      return;
    }

    this.inviteMember.emit({
      userId: parsedUserId,
      role,
    });
  }
}
