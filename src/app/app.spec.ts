import { EventEmitter, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { ProfileService } from './profile/application/profile.service';
import { User } from './profile/domain/model/user.entity';
import { App } from './app';

class ProfileServiceStub {
  readonly notifications = signal([]).asReadonly();
  readonly unreadNotificationCount = signal(0).asReadonly();
  readonly currentUserProfile = signal(
    Object.assign(new User(), {
      id: 1,
      community_id: 1,
      email: 'carlos@ecomind.test',
      birth_date: '1985-04-12',
      name: 'Carlos Mendoza',
      streak: 7,
      commitment: 'I will reduce my energy consumption.',
      registered_at: '2026-05-01',
      gem_balance: 400,
      ecopoints: 420,
    }),
  ).asReadonly();

  refreshCurrentUser() {
    return of(this.currentUserProfile());
  }

  loadNotifications() {
    return of([]);
  }

  markNotificationAsRead() {
    return of(null);
  }

  markAllNotificationsAsRead() {
    return of([]);
  }
}

class TranslateServiceStub {
  currentLang = 'en';
  fallbackLang = 'en';
  onTranslationChange = new EventEmitter();
  onLangChange = new EventEmitter();
  onFallbackLangChange = new EventEmitter();
  onDefaultLangChange = new EventEmitter();

  get(key: string | string[]) {
    return of(key);
  }

  instant(key: string | string[]) {
    return key;
  }

  getParsedResult(key: string | string[]) {
    return key;
  }

  use(lang: string) {
    this.currentLang = lang;
    return of({});
  }

  getCurrentLang() {
    return this.currentLang;
  }

  getFallbackLang() {
    return this.fallbackLang;
  }
}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: ProfileService, useClass: ProfileServiceStub },
        { provide: TranslateService, useClass: TranslateServiceStub },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    expect(app).toBeTruthy();
  });

  it('should render the shared layout', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-layout')).not.toBeNull();
  });
});
