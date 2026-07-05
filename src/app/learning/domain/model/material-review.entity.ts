import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export class MaterialReview implements BaseEntity {
  id: number;
  userId: number;
  materialId: number;
  reviewedAt: string;

  constructor(data: {
    id: number;
    userId: number;
    materialId: number;
    reviewedAt: string;
  }) {
    this.id = data.id;
    this.userId = data.userId;
    this.materialId = data.materialId;
    this.reviewedAt = data.reviewedAt;
  }
}
