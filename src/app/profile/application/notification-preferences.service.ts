import { computed, Injectable, signal } from '@angular/core';
import { Notification } from '../domain/model/notification.entity';

export type NotificationPreferenceKey =
  | 'general'
  | 'friendship'
  | 'quests'
  | 'community'
  | 'achievements'
  | 'learning'
  | 'support';

export interface NotificationPreferences {
  enabled: boolean;
  general: boolean;
  friendship: boolean;
  quests: boolean;
  community: boolean;
  achievements: boolean;
  learning: boolean;
  support: boolean;
}

const STORAGE_KEY = 'ecomind-notification-preferences';

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  general: true,
  friendship: true,
  quests: true,
  community: true,
  achievements: true,
  learning: true,
  support: true,
};

@Injectable({
  providedIn: 'root',
})
export class NotificationPreferencesService {
  private readonly preferencesSignal = signal<NotificationPreferences>(this.loadPreferences());

  readonly preferences = this.preferencesSignal.asReadonly();
  readonly enabled = computed(() => this.preferencesSignal().enabled);

  updatePreference(key: keyof NotificationPreferences, value: boolean): void {
    this.preferencesSignal.update((preferences) => {
      const next = { ...preferences, [key]: value };
      this.savePreferences(next);
      return next;
    });
  }

  allows(notification: Notification): boolean {
    const preferences = this.preferencesSignal();
    if (!preferences.enabled) {
      return false;
    }

    const type = this.normalizeType(notification.type);
    return preferences[type];
  }

  reset(): void {
    this.preferencesSignal.set(DEFAULT_PREFERENCES);
    this.savePreferences(DEFAULT_PREFERENCES);
  }

  private normalizeType(type: string): NotificationPreferenceKey {
    const normalized = type.trim().toLowerCase();
    if (normalized in DEFAULT_PREFERENCES && normalized !== 'enabled') {
      return normalized as NotificationPreferenceKey;
    }

    return 'general';
  }

  private loadPreferences(): NotificationPreferences {
    if (typeof localStorage === 'undefined') {
      return DEFAULT_PREFERENCES;
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_PREFERENCES;
    }

    try {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }

  private savePreferences(preferences: NotificationPreferences): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }
}
