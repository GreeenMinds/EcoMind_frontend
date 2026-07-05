import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export type CollaborativeQuestMemberResponse = BaseResponse & {
  collaborativeQuestMembers: CollaborativeQuestMemberResource[];
};

export type CollaborativeQuestMemberResource = BaseResource & {
  id: number;
  sessionId: number;
  userId: number;
  ownerId: number | null;
  role: string;
  status: string;
  answerDate: string | null;
  revokeDate: string | null;
};

export type InviteCollaborativeQuestMemberPayload = {
  sessionId: number;
  invitedByUserId: number;
  invitedUserId: number;
};
