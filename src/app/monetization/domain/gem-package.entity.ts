import { BaseEntity } from '../../shared/infrastructure/base-entity';

export class GemPackageEntity implements BaseEntity {
  id!: number;
  name!: string;
  gemAmount!: number;
  realPrice!: number;
  currency!: string;
}
