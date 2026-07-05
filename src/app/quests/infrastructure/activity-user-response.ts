import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export type ActivityUserResponse = BaseResponse & {
  activitiesUser: ActivityUserResource[];
};

export type ActivityUserResource = BaseResource & {
  id: number;
  questUserId: number;
  activityId: number;
  progress: number;
  endDate: string | null;
  activityDescription: string | null;
  activityConfiguration: Record<string, unknown> | null;
  collaborativeSessionId: number | null;
};
