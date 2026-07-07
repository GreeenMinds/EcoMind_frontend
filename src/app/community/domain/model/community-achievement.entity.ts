import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export class CommunityAchievement implements BaseEntity {
  id: number;
  community_id: number;
  achievement_id: number;
  date: string;
  achievement_name: string;
  achievement_description: string;
  newly_unlocked: boolean;

  constructor() {
    this.id = 0;
    this.community_id = 0;
    this.achievement_id = 0;
    this.date = '';
    this.achievement_name = '';
    this.achievement_description = '';
    this.newly_unlocked = false;
  }
}
