import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';

export interface QuestsResponse extends BaseResponse {
  quests: QuestResource[];
}

export interface QuestResource extends BaseResource {
  id: number;
  challenge_id: number;
  minigame_id: number | null;
  category: string;
  description: string;
  type: string;
  reward_gems: number;
  reward_ecopoints: number;
  expiration_date: string | null;
  time: number;
}
