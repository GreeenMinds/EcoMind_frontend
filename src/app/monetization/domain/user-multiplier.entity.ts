import { BaseEntity } from '../../shared/infrastructure/base-entity';

export class UserMultiplierEntity implements BaseEntity {
  id: number;
  multiplierId: number;
  userId: number;
  startDate: string;
  endDate: string;

  constructor() {
    this.id = 0;
    this.multiplierId = 0;
    this.userId = 0;
    this.startDate = '';
    this.endDate = '';
  }
}
