import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export class CommunityMember implements BaseEntity {
  id: number;
  community_id: number;
  email: string;
  birth_date: string;
  name: string;
  streak: number;
  commitment: string | null;
  registered_at: string;
  gem_balance: number;
  ecopoints: number;

  constructor() {
    this.id = 0;
    this.community_id = 0;
    this.email = '';
    this.birth_date = '';
    this.name = '';
    this.streak = 0;
    this.commitment = null;
    this.registered_at = '';
    this.gem_balance = 0;
    this.ecopoints = 0;
  }
}
