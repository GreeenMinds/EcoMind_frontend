import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export class Goal implements BaseEntity {
  id: number;
  title: string;
  unit: string;
  quest_category: string;

  constructor() {
    this.id = 0;
    this.title = '';
    this.unit = '';
    this.quest_category = '';
  }
}
