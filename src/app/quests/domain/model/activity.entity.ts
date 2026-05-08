import {BaseEntity} from '../../../shared/infrastructure/base-entity';

export class Activity implements BaseEntity {
  id: number;
  quest_id: number;
  description: string;
  order: number;
  type: string;
  image_url: string | null;

  constructor() {
    this.id = 0;
    this.quest_id = 0;
    this.description = "";
    this.order = 0;
    this.type = "";
    this.image_url = null;
  }
}
