import { computed, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { AuthSession } from '../domain/model/auth-session';
import { SignInPayload } from '../domain/model/sign-in.command';
import { SignUpPayload } from '../domain/model/sign-up.command';
import { AuthenticatedUserResponse, CurrentUserResponse } from '../infrastructure/authentication-response';
import { IamApi } from '../infrastructure/iam-api';

const IAM_SESSION_STORAGE_KEY = 'ecomind-iam-session';
const LEGACY_AUTH_SESSION_STORAGE_KEY = 'ecomind-auth-session';
const LEGACY_AUTH_ACCOUNTS_STORAGE_KEY = 'ecomind-auth-accounts';

@Injectable({
  providedIn: 'root',
})
export class IamService {
  private readonly sessionSignal = signal<AuthSession | null>(this.loadSession());

  readonly currentSession = this.sessionSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.sessionSignal() !== null);
  readonly accessToken = computed(() => this.sessionSignal()?.accessToken ?? null);

  constructor(private readonly iamApi: IamApi) {
    this.clearLegacyMockAccounts();
  }

  signIn(payload: SignInPayload): Observable<AuthSession> {
    return this.iamApi.signIn(this.normalizeCredentials(payload)).pipe(
      map((response) => this.toSession(response)),
      tap((session) => this.setSession(session)),
    );
  }

  signUp(payload: SignUpPayload): Observable<AuthSession> {
    return this.iamApi.signUp(this.normalizeSignUp(payload)).pipe(
      map((response) => this.toSession(response)),
      tap((session) => this.setSession(session)),
    );
  }

  signInWithProvider(provider: 'google' | 'apple'): Observable<AuthSession> {
    return throwError(() => new Error(`${provider} sign in is not connected to IAM yet.`));
  }

  recoverPassword(email: string): Observable<{ email: string; sent: boolean }> {
    return this.iamApi.requestPasswordRecovery(email.trim().toLowerCase());
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.iamApi.confirmPasswordRecovery(token, newPassword);
  }

  restoreSession(): Observable<AuthSession | null> {
    const session = this.sessionSignal();
    if (!session?.accessToken) {
      this.clearStoredSession();
      return of(null);
    }

    return this.iamApi.me().pipe(
      map((user) => this.toSessionFromCurrentUser(user, session.accessToken, session.createdAt)),
      tap((restoredSession) => this.setSession(restoredSession)),
      catchError(() => {
        this.logout(false);
        return of(null);
      }),
    );
  }

  logout(notifyBackend = true): void {
    if (notifyBackend && this.sessionSignal()?.accessToken) {
      this.iamApi.logout().subscribe({ error: () => undefined });
    }
    this.sessionSignal.set(null);
    this.clearStoredSession();
  }

  deleteAccountFacade(): Observable<{ deleted: boolean }> {
    return this.iamApi.deleteAccount().pipe(
      tap(() => this.logout(false)),
      map(() => ({ deleted: true })),
    );
  }

  getCurrentUserId(): number {
    const userId = this.sessionSignal()?.userId;
    if (!userId) {
      throw new Error('No authenticated EcoMind user is available.');
    }
    return userId;
  }

  private normalizeCredentials(payload: SignInPayload): SignInPayload {
    return {
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
    };
  }

  private normalizeSignUp(payload: SignUpPayload): SignUpPayload {
    return {
      ...payload,
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
    };
  }

  private toSession(response: AuthenticatedUserResponse): AuthSession {
    return {
      userId: response.id,
      name: response.name,
      email: response.email,
      accessToken: response.token,
      createdAt: new Date().toISOString(),
    };
  }

  private toSessionFromCurrentUser(
    response: CurrentUserResponse,
    accessToken: string,
    createdAt: string,
  ): AuthSession {
    return {
      userId: response.id,
      name: response.name,
      email: response.email,
      accessToken,
      createdAt,
    };
  }

  private setSession(session: AuthSession): void {
    this.sessionSignal.set(session);
    this.saveSession(session);
  }

  private loadSession(): AuthSession | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const storedSession =
      localStorage.getItem(IAM_SESSION_STORAGE_KEY) ?? localStorage.getItem(LEGACY_AUTH_SESSION_STORAGE_KEY);
    if (!storedSession) {
      return null;
    }

    try {
      const parsed = JSON.parse(storedSession) as Partial<AuthSession>;
      if (!parsed.userId || !parsed.accessToken) {
        this.clearStoredSession();
        return null;
      }
      return parsed as AuthSession;
    } catch {
      this.clearStoredSession();
      return null;
    }
  }

  private saveSession(session: AuthSession): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(IAM_SESSION_STORAGE_KEY, JSON.stringify(session));
    localStorage.removeItem(LEGACY_AUTH_SESSION_STORAGE_KEY);
  }

  private clearStoredSession(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.removeItem(IAM_SESSION_STORAGE_KEY);
    localStorage.removeItem(LEGACY_AUTH_SESSION_STORAGE_KEY);
  }

  private clearLegacyMockAccounts(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.removeItem(LEGACY_AUTH_ACCOUNTS_STORAGE_KEY);
  }
}
