import {BaseEntity} from '../../../shared/infrastructure/base-entity';

export class Quest implements BaseEntity{
  id: number;
  minigame_id: number;
  category: string;
  description: string;
  type: string;
  reward_gems: number;
  reward_ecopoints: number;
  expiration_date: string;
  time: number;

  constructor() {
    this.id = 0;
    this.minigame_id = 0;
    this.category = "";
    this.description = "";
    this.type = "";
    this.reward_gems = 0;
    this.reward_ecopoints = 0;
    this.expiration_date  = "";
    this.time = 0;
  }
}
