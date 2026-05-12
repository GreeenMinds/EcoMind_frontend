import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface QuestUserResponse extends BaseResponse{
  questsUser: QuestUserResource[];
}

export interface QuestUserResource extends BaseResource {
  id: number;
  user_id: number;
  quest_id: number;
  status: string;
  progress: number;
  start_date: string;
  end_date: string | null;
  collaborative_session_id: number | null;
}
