import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export class EducationalMaterial implements BaseEntity {
  id: number;
  title: string;
  description: string | null;
  content: string;
  materialType: string;
  category: string;
  imageUrl: string | null;
  videoUrl: string | null;
  durationMinutes: number | null;

  constructor(data: {
    id: number;
    title: string;
    description: string | null;
    content: string;
    materialType: string;
    category: string;
    imageUrl: string | null;
    videoUrl: string | null;
    durationMinutes: number | null;
  }) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.content = data.content;
    this.materialType = data.materialType;
    this.category = data.category;
    this.imageUrl = data.imageUrl;
    this.videoUrl = data.videoUrl;
    this.durationMinutes = data.durationMinutes;
  }
}
