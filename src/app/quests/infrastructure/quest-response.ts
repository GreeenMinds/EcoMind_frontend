import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export type QuestResponse = BaseResponse & {
  quests: QuestResource[];
};

export type QuestResource = BaseResource & {
  id: number;
  minigame_id: number | null;
  category: string;
  title: string;
  description: string;
  image_url: string | null;
  age: number;
  type: string;
  theme_type: string;
  reward_gems: number;
  reward_ecopoints: number;
  expiration_date: string | null;
  time: number;
};
