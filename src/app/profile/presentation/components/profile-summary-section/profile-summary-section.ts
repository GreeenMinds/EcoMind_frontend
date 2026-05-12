import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Achievement } from '../../../../community/domain/model/achievement.entity';
import { UserAchievement } from '../../../../community/domain/model/user-achievement.entity';

export interface AchievementView {
  achievement: Achievement;
  userAchievement: UserAchievement;
}

@Component({
  selector: 'app-profile-summary-section',
  imports: [TranslatePipe],
  templateUrl: './profile-summary-section.html',
  styleUrl: './profile-summary-section.css',
})
export class ProfileSummarySection {
  private readonly translate = inject(TranslateService);

  @Input() title = 'Mi compromiso';
  @Input() commitment: string | null = null;
  @Input() dateLabel = '';
  @Input() canEdit = false;
  @Input() achievements: AchievementView[] = [];
  @Input() emptyCommitmentText =
    'Aun no registras un compromiso. Puedes editar tu perfil para guardar uno.';
  @Input() emptyAchievementsText = 'Todavia no hay logros visibles para este perfil.';

  @Output() editCommitment = new EventEmitter<void>();

  getAchievementTone(index: number): string {
    const tones = ['sky', 'sun', 'orchid', 'lime'];
    return tones[index % tones.length];
  }

  formatRelativeDate(dateValue: string | null | undefined): string {
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
