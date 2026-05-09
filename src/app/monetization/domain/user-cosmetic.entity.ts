import { BaseEntity } from '../../shared/infrastructure/base-entity';

export class UserCosmeticEntity implements BaseEntity {
  id: number;
  userId: number;
  cosmeticId: number;
  acquiredAt: string;
  equipped: boolean;

  constructor() {
    this.id = 0;
    this.userId = 0;
    this.cosmeticId = 0;
    this.acquiredAt = '';
    this.equipped = false;
  }
}
