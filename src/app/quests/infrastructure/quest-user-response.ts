import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export type QuestUserResponse = BaseResponse & {
  questsUser: QuestUserResource[];
};

export type QuestUserResource = BaseResource & {
  id: number;
  userId: number;
  questId: number;
  status: string;
  progress: number;
  endDate: string | null;
  collaborativeSessionId: number | null;
};
