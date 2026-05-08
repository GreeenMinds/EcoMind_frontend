import {BaseEntity} from '../../../shared/infrastructure/base-entity';

export class QuestUser implements BaseEntity {
  id: number;
  user_id: number;
  quest_id: number;
  status: string;
  progress: number;
  start_date: string;
  end_date: string | null;

  constructor() {
    this.id = 0;
    this.user_id = 0;
    this.quest_id = 0;
    this.status = "";
    this.progress = 0;
    this.start_date = "";
    this.end_date = null;
  }
}
