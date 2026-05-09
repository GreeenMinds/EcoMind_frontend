import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export class UserAchievement implements BaseEntity {
  id: number;
  achievement_id: number;
  user_id: number;
  date: string;

  constructor() {
    this.id = 0;
    this.achievement_id = 0;
    this.user_id = 0;
    this.date = '';
  }
}
