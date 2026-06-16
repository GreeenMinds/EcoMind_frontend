import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export type CollaborativeQuestMemberResponse = BaseResponse & {
  collaborativeQuestMembers: CollaborativeQuestMemberResource[];
};

export type CollaborativeQuestMemberResource = BaseResource & {
  id: number;
  session_id: number;
  user_id: number;
  invited_by_user_id: number | null;
  role: string;
  status: string;
  invited_at: string | null;
  responded_at: string | null;
  left_at: string | null;
  removed_at: string | null;
};
