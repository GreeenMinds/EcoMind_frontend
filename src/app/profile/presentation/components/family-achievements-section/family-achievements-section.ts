import { Component, effect, inject, input, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FamilyAchievement } from '../../../domain/model/family-achievement.entity';
import { ProfileService } from '../../../application/profile.service';

@Component({
  selector: 'app-family-achievements-section',
  imports: [TranslatePipe],
  templateUrl: './family-achievements-section.html',
  styleUrl: './family-achievements-section.css',
})
export class FamilyAchievementsSection {
  private readonly profileService = inject(ProfileService);
  private readonly translate = inject(TranslateService);

  readonly familyId = input<number | null>(null);

  private readonly achievementsSignal = signal<FamilyAchievement[]>([]);
  private readonly loadingSignal = signal(false);

  readonly achievements = this.achievementsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();

  constructor() {
    effect(() => {
      const id = this.familyId();
      if (id === null) {
        this.achievementsSignal.set([]);
        return;
      }

      this.loadingSignal.set(true);
      this.profileService.getFamilyAchievements(id).subscribe({
        next: (achievements) => {
          this.achievementsSignal.set(achievements);
          this.loadingSignal.set(false);
        },
        error: (err) => {
          console.error('Error loading family achievements:', err);
          this.loadingSignal.set(false);
        },
      });
    });
  }

  getTone(index: number): string {
    const tones = ['sky', 'sun', 'orchid', 'lime'];
    return tones[index % tones.length];
  }

  formatRelativeDate(dateValue: string): string {
    if (!dateValue) {
      return this.translate.instant('profilePage.relative.justNow');
    }

    const now = new Date();
    const targetDate = new Date(dateValue);
    const diffInDays = Math.max(
      0,
      Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24)),
    );

    if (diffInDays === 0) {
      return this.translate.instant('profilePage.relative.today');
    }
    if (diffInDays === 1) {
      return this.translate.instant('profilePage.relative.dayAgo');
    }
    if (diffInDays < 30) {
      return this.translate.instant('profilePage.relative.daysAgo', { count: diffInDays });
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths === 1) {
      return this.translate.instant('profilePage.relative.monthAgo');
    }

    return this.translate.instant('profilePage.relative.monthsAgo', { count: diffInMonths });
  }
}
