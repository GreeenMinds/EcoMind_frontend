import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { TutorialProgress } from '../domain/model/tutorial-progress.entity';
import { TutorialProgressResponse, TutorialProgressResource } from './tutorial-progress-response';
import { TutorialProgressAssembler } from './tutorial-progress-assembler';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export class TutorialApiEndpoint extends BaseApiEndpoint<
  TutorialProgress,
  TutorialProgressResource,
  TutorialProgressResponse,
  TutorialProgressAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderTutorialEndpointPath}`,
      new TutorialProgressAssembler(),
    );
  }

  getProgress(userId: number): Observable<TutorialProgress> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<TutorialProgressResource>(`${this.endpointUrl}/progress`, { params }).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to get tutorial progress')),
    );
  }

  completeStep(userId: number): Observable<TutorialProgress> {
    return this.http.post<TutorialProgressResource>(`${this.endpointUrl}/progress/step`, { userId }).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to complete tutorial step')),
    );
  }

  completeTutorial(userId: number): Observable<TutorialProgress> {
    return this.http.post<TutorialProgressResource>(`${this.endpointUrl}/progress/complete`, { userId }).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to complete tutorial')),
    );
  }

  skipTutorial(userId: number): Observable<TutorialProgress> {
    return this.http.post<TutorialProgressResource>(`${this.endpointUrl}/progress/skip`, { userId }).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to skip tutorial')),
    );
  }
}
