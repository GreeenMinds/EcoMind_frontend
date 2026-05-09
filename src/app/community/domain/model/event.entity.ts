import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export class Event implements BaseEntity {
  id: number;
  community_id: number;
  author_id: number;
  name: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  latitude: number;
  longitude: number;
  capacity: number;
  image_url: string | null;

  constructor() {
    this.id = 0;
    this.community_id = 0;
    this.author_id = 0;
    this.name = '';
    this.description = '';
    this.date = '';
    this.start_time = '';
    this.end_time = '';
    this.location = '';
    this.latitude = 0;
    this.longitude = 0;
    this.capacity = 0;
    this.image_url = null;
  }
}
