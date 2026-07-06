import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { MaterialReview } from '../domain/model/material-review.entity';
import { MaterialReviewResponse, MaterialReviewResource } from './material-review-response';
import { MaterialReviewAssembler } from './material-review-assembler';
import { HttpClient, HttpParams } from '@angular/common/http';
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

  getByUserId(userId: number): Observable<MaterialReview[]> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<MaterialReviewResource[]>(this.endpointUrl, { params }).pipe(
      map((resources) => resources.map((r) => this.assembler.toEntityFromResource(r))),
      catchError(this.handleError('Failed to get material reviews')),
    );
  }
}
