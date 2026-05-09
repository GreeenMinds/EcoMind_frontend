import { BaseEntity } from '../../shared/infrastructure/base-entity';

export class GemMovementEntity implements BaseEntity {
  id!: number;
  userId!: number;
  type!: string;
  amount!: number;
  origin!: string;
  originId!: number;
}
