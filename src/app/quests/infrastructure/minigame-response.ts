import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';

export interface MinigameResponse extends BaseResponse {
  minigames: MinigameResource[];
}

export interface MinigameResource extends BaseResource {
  id: number;
  name: string;
  description: string;
  url: string;
}
