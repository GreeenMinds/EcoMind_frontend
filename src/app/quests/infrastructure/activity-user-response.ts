import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export type ActivityUserResponse = BaseResponse & {
  activitiesUser: ActivityUserResource[];
};

export type ActivityUserResource = BaseResource & {
  id: number;
  user_id: number;
  activity_id: number;
  progress: number;
  end_date: string | null;
  collaborative_session_id: number | null;
};
