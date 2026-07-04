import { Injectable, inject } from '@angular/core';
import { AuthService } from '../../auth/application/auth.service';

const DEFAULT_USER_ID = 3;

@Injectable({
  providedIn: 'root',
})
export class CurrentUser {
  private readonly authService = inject(AuthService);

  getCurrentUserId(): number {
    return this.authService.getCurrentUserId(DEFAULT_USER_ID);
  }
}
