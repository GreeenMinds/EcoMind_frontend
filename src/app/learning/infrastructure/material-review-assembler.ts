import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { MaterialReview } from '../domain/model/material-review.entity';
import { MaterialReviewResponse, MaterialReviewResource } from './material-review-response';

export class MaterialReviewAssembler implements BaseAssembler<MaterialReview, MaterialReviewResource, MaterialReviewResponse> {
  toEntitiesFromResponse(response: MaterialReviewResponse): MaterialReview[] {
    return response.materialReviews.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: MaterialReviewResource): MaterialReview {
    return new MaterialReview({
      id: resource.id,
      userId: resource.userId,
      materialId: resource.materialId,
      reviewedAt: resource.reviewedAt,
    });
  }

  toResourceFromEntity(entity: MaterialReview): MaterialReviewResource {
    return {
      id: entity.id,
      userId: entity.userId,
      materialId: entity.materialId,
      reviewedAt: entity.reviewedAt,
    };
  }
}
