import { Component, inject, signal } from '@angular/core';
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
  imports: [LanguageSwitcher],
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
      title: 'Amistades',
      description: 'Solicitudes de amistad, respuestas y cambios de relacion.',
    },
    {
      key: 'quests',
      title: 'Misiones',
      description: 'Retos, progreso, vencimientos y actividades familiares.',
    },
    {
      key: 'community',
      title: 'Comunidad',
      description: 'Eventos, publicaciones e interacciones del feed.',
    },
    {
      key: 'achievements',
      title: 'Logros',
      description: 'Medallas, ranking y logros compartidos.',
    },
    {
      key: 'learning',
      title: 'Learning',
      description: 'Recordatorios educativos y materiales pendientes.',
    },
    {
      key: 'support',
      title: 'Soporte',
      description: 'Actualizaciones de tickets y respuestas del equipo.',
    },
    {
      key: 'general',
      title: 'General',
      description: 'Avisos del sistema y mensajes generales.',
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
