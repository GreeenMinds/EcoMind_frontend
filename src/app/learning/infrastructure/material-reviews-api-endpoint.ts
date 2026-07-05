import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { MaterialReview } from '../domain/model/material-review.entity';
import { MaterialReviewResponse, MaterialReviewResource } from './material-review-response';
import { MaterialReviewAssembler } from './material-review-assembler';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export class MaterialReviewsApiEndpoint extends BaseApiEndpoint<
  MaterialReview,
  MaterialReviewResource,
  MaterialReviewResponse,
  MaterialReviewAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderMaterialReviewEndpointPath}`,
      new MaterialReviewAssembler(),
    );
  }

  markAsReviewed(userId: number, materialId: number): Observable<MaterialReview> {
    return this.http.post<MaterialReviewResource>(this.endpointUrl, { userId, materialId }).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to mark material as reviewed')),
    );
  }
}
