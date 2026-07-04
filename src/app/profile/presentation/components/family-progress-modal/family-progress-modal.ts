import { Component, EventEmitter, Output, effect, inject, input, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FamilyReportsApiEndpoint } from '../../../infrastructure/family-reports-api-endpoint';
import { FamilyReport } from '../../../domain/model/family-report.entity';

@Component({
  selector: 'app-family-progress-modal',
  imports: [TranslatePipe],
  templateUrl: './family-progress-modal.html',
  styleUrl: './family-progress-modal.css',
})
export class FamilyProgressModal {
  private readonly api = inject(FamilyReportsApiEndpoint);
  private readonly translate = inject(TranslateService);

  readonly familyId = input<number | null>(null);

  @Output() close = new EventEmitter<void>();

  private readonly reportSignal = signal<FamilyReport | null>(null);
  private readonly loadingSignal = signal(false);

  readonly report = this.reportSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();

  getAchievementsPercent(report: FamilyReport): string {
    if (report.totalAchievements <= 0) {
      return '0%';
    }
    const percent = (report.achievementsEarned / report.totalAchievements) * 100;
    return `${Math.max(0, Math.min(percent, 100))}%`;
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

  constructor() {
    effect(() => {
      const id = this.familyId();
      if (id === null) {
        this.reportSignal.set(null);
        return;
      }

      this.loadingSignal.set(true);
      this.api.getWeeklyReport(id).subscribe({
        next: (report) => {
          this.reportSignal.set(report);
          this.loadingSignal.set(false);
        },
        error: (err) => {
          console.error('Error loading family report:', err);
          this.loadingSignal.set(false);
        },
      });
    });
  }
}
