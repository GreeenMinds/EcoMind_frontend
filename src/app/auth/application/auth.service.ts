import { Injectable, computed, signal } from '@angular/core';
import { Observable, delay, of, tap, throwError } from 'rxjs';

export interface AuthSession {
  userId: number;
  name: string;
  email: string;
  provider: 'email' | 'google' | 'apple';
  accessToken: string;
  createdAt: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  name: string;
  email: string;
  password: string;
}

const AUTH_STORAGE_KEY = 'ecomind-auth-session';
const AUTH_ACCOUNTS_STORAGE_KEY = 'ecomind-auth-accounts';
const MOCK_AUTH_USER_ID = 1;
const DEMO_ACCOUNTS: StoredAuthAccount[] = [
  {
    userId: 1,
    name: 'Example User',
    email: 'userexample@gmail.com',
    password: 'ecomind123',
  },
];

interface StoredAuthAccount {
  userId: number;
  name: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly sessionSignal = signal<AuthSession | null>(this.loadSession());

  readonly currentSession = this.sessionSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.sessionSignal() !== null);

  signIn(payload: SignInPayload): Observable<AuthSession> {
    const account = this.findAccount(payload.email, payload.password);
    if (!account) {
      return throwError(() => new Error('Invalid credentials')).pipe(delay(350));
    }

    return this.createSession({
      userId: account.userId,
      name: account.name,
      email: account.email,
      provider: 'email',
    });
  }

  signUp(payload: SignUpPayload): Observable<AuthSession> {
    const account: StoredAuthAccount = {
      userId: MOCK_AUTH_USER_ID,
      name: payload.name,
      email: payload.email,
      password: payload.password,
    };
    this.saveAccount(account);

    return this.createSession({ ...account, provider: 'email' });
  }

  signInWithProvider(provider: 'google' | 'apple'): Observable<AuthSession> {
    const providerName = provider === 'google' ? 'Google' : 'Apple';

    return this.createSession({
      userId: MOCK_AUTH_USER_ID,
      name: `EcoMind ${providerName}`,
      email: `${provider}@ecomind.mock`,
      provider,
    });
  }

  recoverPassword(email: string): Observable<{ email: string; sent: boolean }> {
    return of({ email, sent: true }).pipe(delay(350));
  }

  logout(): void {
    this.sessionSignal.set(null);
    this.clearStoredSession();
  }

  deleteAccountFacade(): Observable<{ deleted: boolean }> {
    return of({ deleted: true }).pipe(
      delay(350),
      tap(() => this.logout()),
    );
  }

  getCurrentUserId(fallbackUserId = MOCK_AUTH_USER_ID): number {
    return this.sessionSignal()?.userId ?? fallbackUserId;
  }

  private createSession(input: Pick<AuthSession, 'userId' | 'name' | 'email' | 'provider'>): Observable<AuthSession> {
    const session: AuthSession = {
      ...input,
      accessToken: `mock-${input.provider}-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    return of(session).pipe(
      delay(350),
      tap((nextSession) => {
        this.sessionSignal.set(nextSession);
        this.saveSession(nextSession);
      }),
    );
  }

  private findAccount(email: string, password: string): StoredAuthAccount | null {
    const normalizedEmail = email.trim().toLowerCase();
    return (
      this.loadAccounts().find(
        (account) => account.email.toLowerCase() === normalizedEmail && account.password === password,
      ) ?? null
    );
  }

  private loadAccounts(): StoredAuthAccount[] {
    if (typeof localStorage === 'undefined') {
      return DEMO_ACCOUNTS;
    }

    const storedAccounts = localStorage.getItem(AUTH_ACCOUNTS_STORAGE_KEY);
    if (!storedAccounts) {
      return DEMO_ACCOUNTS;
    }

    try {
      return [...DEMO_ACCOUNTS, ...(JSON.parse(storedAccounts) as StoredAuthAccount[])];
    } catch {
      localStorage.removeItem(AUTH_ACCOUNTS_STORAGE_KEY);
      return DEMO_ACCOUNTS;
    }
  }

  private saveAccount(account: StoredAuthAccount): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const customAccounts = this.loadAccounts()
      .filter((storedAccount) => !DEMO_ACCOUNTS.some((demo) => demo.email === storedAccount.email))
      .filter((storedAccount) => storedAccount.email.toLowerCase() !== account.email.toLowerCase());
    localStorage.setItem(AUTH_ACCOUNTS_STORAGE_KEY, JSON.stringify([...customAccounts, account]));
  }

  private loadSession(): AuthSession | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const storedSession = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!storedSession) {
      return null;
    }

    try {
      return JSON.parse(storedSession) as AuthSession;
    } catch {
      this.clearStoredSession();
      return null;
    }
  }

  private saveSession(session: AuthSession): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  }

  private clearStoredSession(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}
