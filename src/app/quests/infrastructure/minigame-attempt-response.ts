import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';

export interface MinigameAttemptResponse extends BaseResponse {
  minigameAttempts: MinigameAttemptResource[];
}

export interface MinigameAttemptResource extends BaseResource {
  id: number;
  user_id: number;
  quest_id: number;
  score: number;
  status: string;
  start_date: string;
  end_date: string | null;
  metadata: Record<string, unknown>;
}
