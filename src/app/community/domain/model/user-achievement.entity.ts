import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export class UserAchievement implements BaseEntity {
  id: number;
  achievement_id: number;
  user_id: number;
  date: string;
  achievement_name: string;
  achievement_description: string;
  newly_unlocked: boolean;

  constructor() {
    this.id = 0;
    this.achievement_id = 0;
    this.user_id = 0;
    this.date = '';
    this.achievement_name = '';
    this.achievement_description = '';
    this.newly_unlocked = false;
  }
}
