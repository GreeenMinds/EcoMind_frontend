import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export type MinigameResponse = BaseResponse & {
  minigames: MinigameResource[];
};

export type MinigameResource = BaseResource & {
  id: number;
  name: string;
  description: string;
  url: string;
};
