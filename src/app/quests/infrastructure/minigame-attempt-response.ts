import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export type MinigameAttemptResponse = BaseResponse & {
  minigameAttempts: MinigameAttemptResource[];
};

export type MinigameAttemptResource = BaseResource & {
  id: number;
  userId: number;
  questId: number;
  score: number | null;
  status: string;
  startDate: string;
  endDate: string | null;
  metadata: Record<string, unknown>;
  givenGems: number;
  givenEcopoints: number;
};
