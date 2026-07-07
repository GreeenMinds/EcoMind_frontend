import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IamService } from '../../../application/iam.service';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: '../../../../auth/presentation/components/auth-page.css',
})
export class ResetPassword {
  private readonly iamService = inject(IamService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  readonly isSubmitting = signal(false);
  readonly statusMessage = signal('');
  readonly errorMessage = signal('');

  readonly form = this.formBuilder.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!token) {
      this.errorMessage.set('The recovery link is missing a token.');
      return;
    }

    this.isSubmitting.set(true);
    this.statusMessage.set('');
    this.errorMessage.set('');

    this.iamService
      .resetPassword(token, this.form.getRawValue().password)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.statusMessage.set('Your password was updated. You can sign in now.');
          this.isSubmitting.set(false);
        },
        error: () => {
          this.errorMessage.set('We could not update your password.');
          this.isSubmitting.set(false);
        },
      });
  }
}
