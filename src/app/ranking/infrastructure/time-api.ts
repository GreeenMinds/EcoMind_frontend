import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TimeApiService {
  getCurrentTime(): Observable<Date> {
    const now = new Date();
    const limaOffset = -5 * 60;
    const localOffset = now.getTimezoneOffset();
    const limaTime = new Date(now.getTime() + (localOffset - limaOffset) * 60000);
    return of(limaTime);
  }

  calculateDateRange(now: Date, rankingId: number): { start: Date; end: Date } {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    let start: Date;
    if (rankingId === 3) {
      start = new Date(now);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
    } else if (rankingId === 2) {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else {
      start = new Date(0);
    }

    return { start, end };
  }

  formatDateRange(now: Date, rankingId: number, locale: string): string {
    const range = this.calculateDateRange(now, rankingId);
    if (rankingId === 1) return '';

    const monthFmt = new Intl.DateTimeFormat(locale, { month: 'long' });
    const endMonth = monthFmt.format(range.end);
    const endDay = String(range.end.getDate());
    const endYear = String(range.end.getFullYear());

    if (rankingId === 3) {
      const startDay = String(range.start.getDate());
      if (range.start.getMonth() === range.end.getMonth() && range.start.getFullYear() === range.end.getFullYear()) {
        return `${startDay} \u2013 ${endDay} ${this.prep(locale)} ${endMonth}, ${endYear}`;
      }
      const startMonth = monthFmt.format(range.start);
      return `${startDay} ${this.prep(locale)} ${startMonth} \u2013 ${endDay} ${this.prep(locale)} ${endMonth}, ${endYear}`;
    }

    return `1 \u2013 ${endDay} ${this.prep(locale)} ${endMonth}, ${endYear}`;
  }

  private prep(locale: string): string {
    return locale.startsWith('es') ? 'de' : '';
  }
}
