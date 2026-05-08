import {BaseEntity} from '../../../shared/infrastructure/base-entity';

export class Minigame implements BaseEntity {
  id: number;
  name: string;
  description: string;
  url: string;

  constructor() {
    this.id = 0;
    this.name = "";
    this.description = "";
    this.url = "";
  }
}
