import { Injectable, Injector, Signal, signal, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { EducationalMaterial } from '../domain/model/educational-material.entity';
import { MaterialReview } from '../domain/model/material-review.entity';
import { TutorialProgress } from '../domain/model/tutorial-progress.entity';
import { LearningApi } from '../infrastructure/learning-api';
import { CurrentUser } from '../../shared/application/current-user';

@Injectable({
  providedIn: 'root',
})
export class LearningService {
  readonly materialsSignal = signal<EducationalMaterial[]>([]);
  readonly materials = this.materialsSignal.asReadonly();

  readonly favoritesSignal = signal<EducationalMaterial[]>([]);
  readonly favorites = this.favoritesSignal.asReadonly();

  readonly reviewsSignal = signal<MaterialReview[]>([]);
  readonly reviews = this.reviewsSignal.asReadonly();

  readonly tutorialProgressSignal = signal<TutorialProgress | null>(null);
  readonly tutorialProgress = this.tutorialProgressSignal.asReadonly();

  readonly loadingSignal = signal<boolean>(false);
  readonly loading = this.loadingSignal.asReadonly();

  readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  readonly pendingCountSignal = signal<number>(0);
  readonly pendingCount = this.pendingCountSignal.asReadonly();

  readonly currentUserId = computed(() => this.currentUser.getCurrentUserId());
  readonly currentLang = signal<string>('en');

  constructor(
    private readonly learningApi: LearningApi,
    private readonly currentUser: CurrentUser,
    private readonly translate: TranslateService,
    private readonly injector: Injector,
  ) {
    this.currentLang.set(this.translate.getCurrentLang() || 'en');
    this.translate.onLangChange.subscribe((event) => {
      this.currentLang.set(event.lang);
      this.loadMaterials(event.lang);
    });
    this.refreshAll();
  }

  loadMaterials(lang?: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.learningApi.getEducationalMaterials(lang).subscribe({
      next: (materials) => {
        this.materialsSignal.set(materials);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.errorSignal.set(this.formatError(err, 'Failed to load educational materials'));
        this.loadingSignal.set(false);
      },
    });
  }

  searchMaterials(title?: string, category?: string, materialType?: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.learningApi.searchEducationalMaterials(title, category, materialType).subscribe({
      next: (materials) => {
        this.materialsSignal.set(materials);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.errorSignal.set(this.formatError(err, 'Failed to search educational materials'));
        this.loadingSignal.set(false);
      },
    });
  }

  getMaterialById(id: number): Signal<EducationalMaterial | undefined> {
    return computed(() => this.materials().find((item) => item.id === id));
  }

  toggleFavorite(materialId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.learningApi.toggleFavorite(materialId, this.currentUserId()).subscribe({
      next: () => {
        const favorites = this.favoritesSignal();
        const existing = favorites.find((item) => item.id === materialId);
        if (existing) {
          this.favoritesSignal.update((current) => current.filter((item) => item.id !== materialId));
        } else {
          const material = this.materials().find((item) => item.id === materialId);
          if (material) {
            this.favoritesSignal.update((current) => [...current, material]);
          }
        }
        this.loadPendingCount();
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.errorSignal.set(this.formatError(err, 'Failed to toggle favorite'));
        this.loadingSignal.set(false);
      },
    });
  }

  loadFavorites(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.learningApi.getEducationalMaterials().subscribe({
      next: (materials) => {
        this.favoritesSignal.set(materials);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.errorSignal.set(this.formatError(err, 'Failed to load favorites'));
        this.loadingSignal.set(false);
      },
    });
  }

  markAsReviewed(materialId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.learningApi.markMaterialAsReviewed(this.currentUserId(), materialId).subscribe({
      next: () => {
        this.loadReviews();
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.errorSignal.set(this.formatError(err, 'Failed to mark material as reviewed'));
        this.loadingSignal.set(false);
      },
    });
  }

  loadReviews(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.learningApi.getMaterialReviews(this.currentUserId()).subscribe({
      next: (reviews) => {
        this.reviewsSignal.set(reviews);
        this.loadPendingCount();
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.errorSignal.set(this.formatError(err, 'Failed to load reviews'));
        this.loadingSignal.set(false);
      },
    });
  }

  loadTutorialProgress(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.learningApi.getTutorialProgress(this.currentUserId()).subscribe({
      next: (progress) => {
        this.tutorialProgressSignal.set(progress);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        if (err instanceof HttpErrorResponse && err.status === 404) {
          this.tutorialProgressSignal.set(null);
          this.loadingSignal.set(false);
          return;
        }
        this.errorSignal.set(this.formatError(err, 'Failed to load tutorial progress'));
        this.loadingSignal.set(false);
      },
    });
  }

  completeStep(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.learningApi.completeTutorialStep(this.currentUserId()).subscribe({
      next: (progress) => {
        this.tutorialProgressSignal.set(progress);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.errorSignal.set(this.formatError(err, 'Failed to complete tutorial step'));
        this.loadingSignal.set(false);
      },
    });
  }

  completeTutorial(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.tutorialProgressSignal.set(new TutorialProgress({ id: 0, userId: this.currentUserId(), currentStep: 7, totalSteps: 7, completed: true, skipped: false, completedAt: new Date().toISOString() }));
    this.learningApi.completeTutorial(this.currentUserId()).subscribe({
      next: (progress) => {
        this.tutorialProgressSignal.set(progress);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.loadingSignal.set(false);
      },
    });
  }

  skipTutorial(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.tutorialProgressSignal.set(new TutorialProgress({ id: 0, userId: this.currentUserId(), currentStep: 0, totalSteps: 7, completed: true, skipped: true, completedAt: new Date().toISOString() }));
    this.learningApi.skipTutorial(this.currentUserId()).subscribe({
      next: (progress) => {
        this.tutorialProgressSignal.set(progress);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.loadingSignal.set(false);
      },
    });
  }

  loadPendingCount(): void {
    const reviewedMaterialIds = new Set(this.reviews().map((r) => r.materialId));
    const pending = this.favorites().filter((fav) => !reviewedMaterialIds.has(fav.id));
    this.pendingCountSignal.set(pending.length);
  }

  refreshAll(): void {
    this.loadMaterials(this.currentLang());
    this.loadReviews();
    this.loadTutorialProgress();
  }

  formatError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const backendError = error.error;
      if (backendError?.details) {
        return `${fallback}: ${backendError.details}`;
      }
      if (backendError?.message) {
        return `${fallback}: ${backendError.message}`;
      }
      return `${fallback}: ${error.statusText || error.status}`;
    }

    if (error instanceof Error) {
      return error.message.includes('Resource not found')
        ? `${fallback}: Not found`
        : error.message;
    }
    return fallback;
  }
}
