import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export type MaterialReviewResponse = BaseResponse & {
  materialReviews: MaterialReviewResource[];
};

export type MaterialReviewResource = BaseResource & {
  id: number;
  userId: number;
  materialId: number;
  reviewedAt: string;
};
