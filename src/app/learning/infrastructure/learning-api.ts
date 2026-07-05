import { Injectable } from '@angular/core';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { EducationalMaterial } from '../domain/model/educational-material.entity';
import { MaterialReview } from '../domain/model/material-review.entity';
import { TutorialProgress } from '../domain/model/tutorial-progress.entity';
import { EducationalMaterialsApiEndpoint } from './educational-materials-api-endpoint';
import { MaterialReviewsApiEndpoint } from './material-reviews-api-endpoint';
import { TutorialApiEndpoint } from './tutorial-api-endpoint';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LearningApi extends BaseApi {
  private readonly educationalMaterialsEndpoint: EducationalMaterialsApiEndpoint;
  private readonly materialReviewsEndpoint: MaterialReviewsApiEndpoint;
  private readonly tutorialEndpoint: TutorialApiEndpoint;

  constructor(http: HttpClient) {
    super();
    this.educationalMaterialsEndpoint = new EducationalMaterialsApiEndpoint(http);
    this.materialReviewsEndpoint = new MaterialReviewsApiEndpoint(http);
    this.tutorialEndpoint = new TutorialApiEndpoint(http);
  }

  getEducationalMaterials(): Observable<EducationalMaterial[]> {
    return this.educationalMaterialsEndpoint.getAll();
  }

  searchEducationalMaterials(title?: string, category?: string, materialType?: string): Observable<EducationalMaterial[]> {
    return this.educationalMaterialsEndpoint.search(title, category, materialType);
  }

  toggleFavorite(materialId: number, userId: number): Observable<void> {
    return this.educationalMaterialsEndpoint.toggleFavorite(materialId, userId);
  }

  getEducationalMaterialById(id: number): Observable<EducationalMaterial> {
    return this.educationalMaterialsEndpoint.getById(id);
  }

  getMaterialReviews(userId: number): Observable<MaterialReview[]> {
    return this.materialReviewsEndpoint.getByUserId(userId);
  }

  markMaterialAsReviewed(userId: number, materialId: number): Observable<MaterialReview> {
    return this.materialReviewsEndpoint.markAsReviewed(userId, materialId);
  }

  getTutorialProgress(userId: number): Observable<TutorialProgress> {
    return this.tutorialEndpoint.getProgress(userId);
  }

  completeTutorialStep(userId: number): Observable<TutorialProgress> {
    return this.tutorialEndpoint.completeStep(userId);
  }

  completeTutorial(userId: number): Observable<TutorialProgress> {
    return this.tutorialEndpoint.completeTutorial(userId);
  }

  skipTutorial(userId: number): Observable<TutorialProgress> {
    return this.tutorialEndpoint.skipTutorial(userId);
  }
}
