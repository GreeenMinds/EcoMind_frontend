import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export class Friend implements BaseEntity {
  id: number;
  user_id: number;
  friend_id: number;
  status: string;

  constructor() {
    this.id = 0;
    this.user_id = 0;
    this.friend_id = 0;
    this.status = '';
  }
}
