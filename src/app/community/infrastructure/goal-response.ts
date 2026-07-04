import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface GoalResponse extends BaseResponse {
  goals: GoalResource[];
}

export interface GoalResource extends BaseResource {
  id: number;
  title: string;
  unit: string;
}
