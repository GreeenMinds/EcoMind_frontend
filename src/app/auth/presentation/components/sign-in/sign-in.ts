import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IamService } from '../../../../iam/application/iam.service';

@Component({
  selector: 'app-sign-in',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './sign-in.html',
  styleUrl: '../auth-page.css',
})
export class SignIn {
  private readonly iamService = inject(IamService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.iamService
      .signIn(this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => void this.router.navigateByUrl(this.redirectUrl()),
        error: () => {
          this.errorMessage.set('Invalid email or password.');
          this.isSubmitting.set(false);
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
        next: () => void this.router.navigateByUrl(this.redirectUrl()),
        error: () => {
          this.errorMessage.set('Provider sign in is temporarily unavailable.');
          this.isSubmitting.set(false);
        },
      });
  }

  private redirectUrl(): string {
    return this.route.snapshot.queryParamMap.get('redirectTo') ?? '/quests';
  }
}
