import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export class Notification implements BaseEntity {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  reference_type: string | null;
  reference_id: number | null;
  created_at: string;
  read_at: string | null;

  constructor() {
    this.id = 0;
    this.user_id = 0;
    this.type = 'general';
    this.title = '';
    this.message = '';
    this.is_read = false;
    this.reference_type = null;
    this.reference_id = null;
    this.created_at = '';
    this.read_at = null;
  }
}
