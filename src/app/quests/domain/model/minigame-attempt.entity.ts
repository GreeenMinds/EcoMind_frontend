import {BaseEntity} from '../../../shared/infrastructure/base-entity';

export class MinigameAttempt implements BaseEntity {
  id: number;
  user_id: number;
  quest_id: number;
  score: number;
  status: string;
  start_date: string;
  end_date: string | null;
  metadata: Record<string, unknown>;

  constructor() {
    this.id = 0;
    this.user_id = 0;
    this.quest_id = 0;
    this.score = 0;
    this.status = "";
    this.start_date = "";
    this.end_date = null;
    this.metadata = {};
  }
}
