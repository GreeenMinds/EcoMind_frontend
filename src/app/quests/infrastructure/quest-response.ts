import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';

export interface QuestResponse extends BaseResponse {
  quests: QuestResource[];
}

export interface QuestResource extends BaseResource {
  id: number;
  minigame_id: number | null;
  category: string;
  title: string;
  description: string;
  image_url: string | null;
  age: number;
  type: string;
  reward_gems: number;
  reward_ecopoints: number;
  expiration_date: string | null;
  time: number;
}
