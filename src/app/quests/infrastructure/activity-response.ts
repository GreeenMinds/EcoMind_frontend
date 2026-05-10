import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface ActivityResponse extends BaseResponse {
  activities: ActivityResource[];
}

export interface ActivityResource extends BaseResource {
  id: number;
  quest_id: number;
  description: string;
  order: number;
  type: string;
  image_url: string | null;
}
