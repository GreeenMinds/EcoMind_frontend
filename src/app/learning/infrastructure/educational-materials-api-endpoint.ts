import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { EducationalMaterial } from '../domain/model/educational-material.entity';
import { EducationalMaterialResponse, EducationalMaterialResource } from './educational-material-response';
import { EducationalMaterialAssembler } from './educational-material-assembler';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export class EducationalMaterialsApiEndpoint extends BaseApiEndpoint<
  EducationalMaterial,
  EducationalMaterialResource,
  EducationalMaterialResponse,
  EducationalMaterialAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderEducationalMaterialEndpointPath}`,
      new EducationalMaterialAssembler(),
    );
  }

  getByLang(lang: string): Observable<EducationalMaterial[]> {
    const params = new HttpParams().set('lang', lang);
    return this.http.get<EducationalMaterialResource[]>(this.endpointUrl, { params }).pipe(
      map((resources) => resources.map((r) => this.assembler.toEntityFromResource(r))),
      catchError(this.handleError('Failed to fetch educational materials by language')),
    );
  }

  toggleFavorite(materialId: number, userId: number): Observable<void> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.post<void>(`${this.endpointUrl}/${materialId}/favorite`, null, { params }).pipe(
      catchError(this.handleError('Failed to toggle favorite')),
    );
  }

  search(title?: string, category?: string, materialType?: string): Observable<EducationalMaterial[]> {
    let params = new HttpParams();

    if (title) {
      params = params.set('title', title);
    }
    if (category) {
      params = params.set('category', category);
    }
    if (materialType) {
      params = params.set('materialType', materialType);
    }

    return this.http.get<EducationalMaterialResponse | EducationalMaterialResource[]>(`${this.endpointUrl}/search`, { params }).pipe(
      map((response) => {
        if (Array.isArray(response)) {
          return response.map((resource) => this.assembler.toEntityFromResource(resource));
        }
        return this.assembler.toEntitiesFromResponse(response);
      }),
      catchError(this.handleError('Failed to search educational materials')),
    );
  }
}
