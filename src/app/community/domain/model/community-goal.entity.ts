import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export class CommunityGoal implements BaseEntity {
  id: number;
  community_id: number;
  goal_id: number;
  title: string;
  description: string;
  target: number;
  progress: number;
  unit: string;
  participants: number;
  status: string;

  constructor() {
    this.id = 0;
    this.community_id = 0;
    this.goal_id = 0;
    this.title = '';
    this.description = '';
    this.target = 0;
    this.progress = 0;
    this.unit = '';
    this.participants = 0;
    this.status = '';
  }
}
