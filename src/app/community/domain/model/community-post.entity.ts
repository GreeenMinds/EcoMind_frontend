import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export class CommunityPost implements BaseEntity {
  id: number;
  community_id: number;
  user_id: number;
  content: string;
  points: number;
  likes: number;
  image_url: string | null;
  created_at: string;

  constructor() {
    this.id = 0;
    this.community_id = 0;
    this.user_id = 0;
    this.content = '';
    this.points = 0;
    this.likes = 0;
    this.image_url = null;
    this.created_at = '';
  }
}
