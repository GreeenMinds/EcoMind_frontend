import {BaseEntity} from '../../../shared/infrastructure/base-entity';

export class ActivityUser implements BaseEntity {
  id: number;
  user_id: number;
  activity_id: number;
  progress: number;
  end_date: string | null;

  constructor() {
    this.id = 0;
    this.user_id = 0;
    this.activity_id = 0;
    this.progress = 0;
    this.end_date = null;
  }
}
