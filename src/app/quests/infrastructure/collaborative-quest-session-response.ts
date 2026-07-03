import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export type CollaborativeQuestSessionResponse = BaseResponse & {
  collaborativeQuestSessions: CollaborativeQuestSessionResource[];
};

export type CollaborativeQuestSessionResource = BaseResource & {
  id: number;
  questId: number;
  ownerUserId: number;
  status: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
};

export type CollaborativeQuestSessionStateResource = {
  session: CollaborativeQuestSessionResource | null;
  members: import('./collaborative-quest-member-response').CollaborativeQuestMemberResource[];
  currentMember: import('./collaborative-quest-member-response').CollaborativeQuestMemberResource | null;
  pendingInvitation: import('./collaborative-quest-member-response').CollaborativeQuestMemberResource | null;
  permissions: CollaborativeQuestPermissionsResource;
  counters: CollaborativeQuestCountersResource;
};

export type CreateCollaborativeQuestSessionPayload = {
  questId: number;
  ownerUserId: number;
};

export type CollaborativeQuestPermissionsResource = {
  canInvite: boolean;
  canStart: boolean;
  canAcceptInvitation: boolean;
  canLeave: boolean;
  canRemoveMembers: boolean;
  canDeleteSession: boolean;
};

export type CollaborativeQuestCountersResource = {
  acceptedInvites: number;
  pendingInvites: number;
  activeInvites: number;
  maxInvites: number;
};
