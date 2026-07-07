import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export type ActivityResponse = BaseResponse & {
  activities: ActivityResource[];
};

export type ActivityResource = BaseResource & {
  id: number;
  questId: number;
  description: string;
  order: number;
  type: string;
  activityConfiguration: Record<string, unknown> | null;
  image: string | null;
};
