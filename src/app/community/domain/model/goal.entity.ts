import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export class Goal implements BaseEntity {
  id: number;
  title: string;
  unit: string;

  constructor() {
    this.id = 0;
    this.title = '';
    this.unit = '';
  }
}
