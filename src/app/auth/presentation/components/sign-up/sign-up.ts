import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IamService } from '../../../../iam/application/iam.service';
import { environment } from '../../../../../environments/environment';

interface SignUpCommunity {
  id: number;
  name: string;
  location: string;
  user_count: number;
}

@Component({
  selector: 'app-sign-up',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './sign-up.html',
  styleUrl: '../auth-page.css',
})
export class SignUp {
  private readonly iamService = inject(IamService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly communities = signal<SignUpCommunity[]>([]);
  readonly communitiesLoading = signal(false);
  readonly communitiesError = signal('');

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    communityId: [0, [Validators.required, Validators.min(1)]],
    birthDate: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    commitment: ['', [Validators.maxLength(1000)]],
    terms: [false, Validators.requiredTrue],
  });

  constructor() {
    this.loadCommunities();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Please review the highlighted fields.');
      return;
    }

    const { name, email, password, communityId, birthDate, commitment } = this.form.getRawValue();
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.iamService
      .signUp({
        name,
        email,
        password,
        communityId,
        birthDate,
        commitment: commitment.trim() || null,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => void this.router.navigateByUrl('/quests'),
        error: (error) => {
          this.errorMessage.set(this.formatError(error));
          this.isSubmitting.set(false);
        },
      });
  }

  private loadCommunities(): void {
    const url = `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderCommunityEndpointPath}`;
    this.communitiesLoading.set(true);
    this.communitiesError.set('');

    this.http
      .get<SignUpCommunity[]>(url)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (communities) => {
          this.communities.set(communities);
          this.communitiesLoading.set(false);
        },
        error: () => {
          this.communitiesError.set('Communities could not be loaded.');
          this.communitiesLoading.set(false);
        },
      });
  }

  signInWithProvider(provider: 'google' | 'apple'): void {
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.iamService
      .signInWithProvider(provider)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => void this.router.navigateByUrl('/quests'),
        error: () => {
          this.errorMessage.set('Provider sign up is temporarily unavailable.');
          this.isSubmitting.set(false);
        },
      });
  }

  shouldShowError(controlName: keyof typeof this.form.controls, errorName?: string): boolean {
    const control = this.form.controls[controlName];
    const hasError = errorName ? control.hasError(errorName) : control.invalid;
    return hasError && (control.touched || control.dirty);
  }

  private formatError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const message = this.extractServerMessage(error.error);

      if (message) {
        return message;
      }

      if (error.status === 409) {
        return 'This email is already registered.';
      }
    }

    return 'We could not create your account.';
  }

  private extractServerMessage(errorBody: unknown): string | null {
    if (typeof errorBody === 'string') {
      return errorBody;
    }

    if (errorBody && typeof errorBody === 'object' && 'message' in errorBody) {
      const message = (errorBody as { message?: unknown }).message;
      return typeof message === 'string' ? message : null;
    }

    return null;
  }
}
