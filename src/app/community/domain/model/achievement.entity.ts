import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export class Achievement implements BaseEntity {
  id: number;
  name: string;
  description: string;
  type: string;

  constructor() {
    this.id = 0;
    this.name = '';
    this.description = '';
    this.type = '';
  }
}
