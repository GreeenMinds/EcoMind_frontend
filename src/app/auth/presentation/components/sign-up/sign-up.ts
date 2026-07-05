import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../application/auth.service';

@Component({
  selector: 'app-sign-up',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './sign-up.html',
  styleUrl: '../auth-page.css',
})
export class SignUp {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    birthDate: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    commitment: ['', [Validators.maxLength(1000)]],
    terms: [false, Validators.requiredTrue],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, email, password, birthDate, commitment } = this.form.getRawValue();
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.authService
      .signUp({
        name,
        email,
        password,
        birthDate,
        commitment: commitment.trim() || null,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => void this.router.navigateByUrl('/quests'),
        error: () => {
          this.errorMessage.set('We could not create your account.');
          this.isSubmitting.set(false);
        },
      });
  }

  signInWithProvider(provider: 'google' | 'apple'): void {
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.authService
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
}
