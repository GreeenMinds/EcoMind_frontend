import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export class FamilyUser implements BaseEntity {
  id: number;
  user_id: number;
  family_id: number;
  family_role: string;
  joined_at: string;

  constructor() {
    this.id = 0;
    this.user_id = 0;
    this.family_id = 0;
    this.family_role = '';
    this.joined_at = '';
  }
}
