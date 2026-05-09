import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export class EventRegistration implements BaseEntity {
  id: number;
  event_id: number;
  user_id: number;
  family_id: number | null;
  registration_type: string;
  registered_at: string;
  status: string;

  constructor() {
    this.id = 0;
    this.event_id = 0;
    this.user_id = 0;
    this.family_id = null;
    this.registration_type = '';
    this.registered_at = '';
    this.status = '';
  }
}
