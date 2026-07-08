import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { IamService } from '../../../../iam/application/iam.service';
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

interface FaqOption {
  question: string;
  answer: string;
  category: string;
}

interface FaqCategory {
  key: string;
  label: string;
  items: FaqOption[];
}

@Component({
  selector: 'app-settings-content',
  imports: [LanguageSwitcher, TranslatePipe],
  templateUrl: './settings-content.html',
  styleUrl: './settings-content.css',
})
export class SettingsContent {
  private readonly iamService = inject(IamService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notificationPreferences = inject(NotificationPreferencesService);
  private readonly router = inject(Router);

  readonly preferences = this.notificationPreferences.preferences;
  readonly deleteAccountConfirmationOpen = signal(false);
  readonly deleteAccountConfirmationText = signal('');
  readonly deleteAccountInProgress = signal(false);
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
  readonly faqCategories: FaqCategory[] = [
    {
      key: 'account',
      label: 'settings.faq.categories.account',
      items: [
        {
          question: 'settings.faq.questions.deleteAccount.question',
          answer: 'settings.faq.questions.deleteAccount.answer',
          category: 'account',
        },
        {
          question: 'settings.faq.questions.offline.question',
          answer: 'settings.faq.questions.offline.answer',
          category: 'account',
        },
      ],
    },
    {
      key: 'points',
      label: 'settings.faq.categories.points',
      items: [
        {
          question: 'settings.faq.questions.morePoints.question',
          answer: 'settings.faq.questions.morePoints.answer',
          category: 'points',
        },
        {
          question: 'settings.faq.questions.rewards.question',
          answer: 'settings.faq.questions.rewards.answer',
          category: 'points',
        },
        {
          question: 'settings.faq.questions.commitment.question',
          answer: 'settings.faq.questions.commitment.answer',
          category: 'points',
        },
      ],
    },
    {
      key: 'community',
      label: 'settings.faq.categories.community',
      items: [
        {
          question: 'settings.faq.questions.freeActivities.question',
          answer: 'settings.faq.questions.freeActivities.answer',
          category: 'community',
        },
        {
          question: 'settings.faq.questions.inviteFamily.question',
          answer: 'settings.faq.questions.inviteFamily.answer',
          category: 'community',
        },
      ],
    },
  ];

  readonly faqOptions: FaqOption[] = this.faqCategories.flatMap((c) => c.items);

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

  closeAccount(): void {
    this.iamService.logout();
    void this.router.navigateByUrl('/sign-in');
  }

  openDeleteAccountConfirmation(): void {
    this.deleteAccountConfirmationText.set('');
    this.deleteAccountConfirmationOpen.set(true);
  }

  closeDeleteAccountConfirmation(): void {
    if (this.deleteAccountInProgress()) {
      return;
    }

    this.deleteAccountConfirmationOpen.set(false);
    this.deleteAccountConfirmationText.set('');
  }

  updateDeleteAccountConfirmation(value: string): void {
    this.deleteAccountConfirmationText.set(value);
  }

  deleteAccount(): void {
    if (this.deleteAccountConfirmationText() !== 'ELIMINAR') {
      return;
    }

    this.deleteAccountInProgress.set(true);
    this.iamService
      .deleteAccountFacade()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => void this.router.navigateByUrl('/sign-up'),
        error: () => this.deleteAccountInProgress.set(false),
      });
  }
}
