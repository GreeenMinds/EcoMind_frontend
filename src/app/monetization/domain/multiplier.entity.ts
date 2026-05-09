import { BaseEntity } from '../../shared/infrastructure/base-entity';

export class MultiplierEntity implements BaseEntity {
  id!: number;
  multiplierFactor!: number;
  durationMinutes!: number;
  gemCost!: number;
}

