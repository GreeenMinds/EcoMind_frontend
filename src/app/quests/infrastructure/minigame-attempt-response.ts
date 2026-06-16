import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export type MinigameAttemptResponse = BaseResponse & {
  minigameAttempts: MinigameAttemptResource[];
};

export type MinigameAttemptResource = BaseResource & {
  id: number;
  user_id: number;
  quest_id: number;
  score: number;
  status: string;
  start_date: string;
  end_date: string | null;
  metadata: Record<string, unknown>;
};
