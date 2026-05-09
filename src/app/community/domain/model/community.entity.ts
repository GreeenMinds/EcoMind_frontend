import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export class Community implements BaseEntity {
  id: number;
  name: string;
  user_count: number;
  location: string;

  constructor() {
    this.id = 0;
    this.name = '';
    this.user_count = 0;
    this.location = '';
  }
}
