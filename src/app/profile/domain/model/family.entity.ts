import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export class Family implements BaseEntity {
  id: number;
  name: string;
  commitment: string | null;

  constructor() {
    this.id = 0;
    this.name = '';
    this.commitment = null;
  }
}
