import { Component, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcher } from '../../../../shared/presentation/components/language-switcher/language-switcher';
import {
  NotificationPreferenceKey,
  NotificationPreferencesService,
} from '../../../../profile/application/notification-preferences.service';

interface NotificationPreferenceOption {
  key: NotificationPreferenceKey;
  title: string;
  description: string;
}

@Component({
  selector: 'app-settings-content',
  imports: [LanguageSwitcher, TranslatePipe],
  templateUrl: './settings-content.html',
  styleUrl: './settings-content.css',
})
export class SettingsContent {
  private readonly notificationPreferences = inject(NotificationPreferencesService);

  readonly preferences = this.notificationPreferences.preferences;
  readonly notificationSettingsOpen = signal(false);
  readonly notificationOptions: NotificationPreferenceOption[] = [
    {
      key: 'friendship',
      title: 'settings.notifications.options.friendship.title',
      description: 'settings.notifications.options.friendship.description',
    },
    {
      key: 'quests',
      title: 'settings.notifications.options.quests.title',
      description: 'settings.notifications.options.quests.description',
    },
    {
      key: 'community',
      title: 'settings.notifications.options.community.title',
      description: 'settings.notifications.options.community.description',
    },
    {
      key: 'achievements',
      title: 'settings.notifications.options.achievements.title',
      description: 'settings.notifications.options.achievements.description',
    },
    {
      key: 'learning',
      title: 'settings.notifications.options.learning.title',
      description: 'settings.notifications.options.learning.description',
    },
    {
      key: 'support',
      title: 'settings.notifications.options.support.title',
      description: 'settings.notifications.options.support.description',
    },
    {
      key: 'general',
      title: 'settings.notifications.options.general.title',
      description: 'settings.notifications.options.general.description',
    },
  ];

  toggleNotifications(enabled: boolean): void {
    this.notificationPreferences.updatePreference('enabled', enabled);
  }

  toggleNotificationSettings(): void {
    this.notificationSettingsOpen.update((open) => !open);
  }

  toggleType(key: NotificationPreferenceKey, enabled: boolean): void {
    this.notificationPreferences.updatePreference(key, enabled);
  }

  resetNotificationPreferences(): void {
    this.notificationPreferences.reset();
  }
}
