import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';

export interface ActivityUserResponse extends BaseResponse {
  activitiesUser: ActivityUserResource[];
}

export interface ActivityUserResource extends BaseResource {
  id: number;
  user_id: number;
  activity_id: number;
  progress: number;
  end_date: string | null;
}
