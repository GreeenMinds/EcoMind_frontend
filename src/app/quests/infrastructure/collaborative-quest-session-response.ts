import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';

export interface CollaborativeQuestSessionResponse extends BaseResponse {
  collaborativeQuestSessions: CollaborativeQuestSessionResource[];
}

export interface CollaborativeQuestSessionResource extends BaseResource {
  id: number;
  quest_id: number;
  owner_user_id: number;
  status: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}
