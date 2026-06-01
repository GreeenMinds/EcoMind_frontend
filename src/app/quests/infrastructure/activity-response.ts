import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export type ActivityResponse = BaseResponse & {
  activities: ActivityResource[];
};

export type ActivityResource = BaseResource & {
  id: number;
  quest_id: number;
  description: string;
  order: number;
  type: string;
  image_url: string | null;
};
