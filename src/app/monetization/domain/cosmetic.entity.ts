import {BaseEntity} from '../../shared/infrastructure/base-entity';

export class CosmeticEntity implements BaseEntity {
  id: number;
  name: string;
  description: string;
  price: number;
  type: string;
  imageUrl: string;
  constructor() {
    this.id = 0;
    this.name = '';
    this.description = '';
    this.price = 0;
    this.type = '';
    this.imageUrl = '';
  }
}
