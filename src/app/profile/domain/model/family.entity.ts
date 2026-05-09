import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export class Family implements BaseEntity {
  id: number;
  name: string;

  constructor() {
    this.id = 0;
    this.name = '';
  }
}
