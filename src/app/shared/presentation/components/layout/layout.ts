import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { forkJoin } from 'rxjs';
import { NotificationPreferencesService } from '../../../../profile/application/notification-preferences.service';
import { ProfileService } from '../../../../profile/application/profile.service';
import { Sidebar } from '../sidebar/sidebar';
import { MonetizationStoreService } from '../../../../monetization/application/monetization-store.service';
import { ProfileAvatar } from '../../../../profile/presentation/components/profile-avatar/profile-avatar';

@Component({
  selector: 'app-layout',
  imports: [Sidebar, RouterOutlet, ProfileAvatar],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  private readonly destroyRef = inject(DestroyRef);
  private readonly notificationPreferences = inject(NotificationPreferencesService);
  private readonly profileService = inject(ProfileService);
  readonly monetizationStore = inject(MonetizationStoreService);
  readonly currentUser = this.profileService.currentUserProfile;
  readonly notificationPanelOpen = signal(false);
  readonly notificationsEnabled = this.notificationPreferences.enabled;
  readonly notifications = computed(() =>
    this.profileService.notifications().filter((notification) =>
      this.notificationPreferences.allows(notification)
    )
  );
  readonly unreadNotificationCount = computed(
    () => this.notifications().filter((notification) => !notification.is_read).length
  );

  /** URL del avatar equipado (tipo 'avatar'), o null si solo tiene iniciales */
  readonly equippedAvatarUrl = computed(() => {
    const equipped = this.monetizationStore.cosmeticSummaries().find(
      (s) => s.equipped && s.cosmetic.type === 'avatar'
    );
    return equipped?.cosmetic.imageUrl ?? null;
  });

  readonly equippedOverlayUrl = computed(() => {
    const overlay = this.monetizationStore.cosmeticSummaries().find(
      (s) => s.equipped && s.cosmetic.type !== 'avatar'
    );
    return overlay?.cosmetic.imageUrl ?? null;
  });

  readonly equippedOverlayType = computed(() => {
    const overlay = this.monetizationStore.cosmeticSummaries().find(
      (s) => s.equipped && s.cosmetic.type !== 'avatar'
    );
    return overlay?.cosmetic.type ?? null;
  });

  constructor() {
    this.profileService.refreshCurrentUser().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.profileService.loadNotifications().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  toggleNotifications(): void {
    const nextOpenState = !this.notificationPanelOpen();
    this.notificationPanelOpen.set(nextOpenState);
    if (nextOpenState) {
      this.profileService.loadNotifications().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    }
  }

  markNotificationAsRead(notificationId: number): void {
    this.profileService
      .markNotificationAsRead(notificationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  markAllNotificationsAsRead(): void {
    const unreadVisibleNotificationIds = this.notifications()
      .filter((notification) => !notification.is_read)
      .map((notification) => notification.id);

    if (unreadVisibleNotificationIds.length === 0) {
      return;
    }

    forkJoin(
      unreadVisibleNotificationIds.map((notificationId) =>
        this.profileService.markNotificationAsRead(notificationId)
      )
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  formatNotificationDate(value: string): string {
    if (!value) {
      return '';
    }

    return new Intl.DateTimeFormat('es', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }
}
