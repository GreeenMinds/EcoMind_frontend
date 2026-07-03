import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export type QuestResponse = BaseResponse & {
  quests: QuestResource[];
};

export type QuestResource = BaseResource & {
  id: number;
  minigameId: number | null;
  title: string;
  description: string;
  category: string;
  type: string;
  gemReward: number;
  ecopoints: number;
  age: number;
  time: number;
  theme: string;
  assignedDate: string | null;
  image: string | null;
};
