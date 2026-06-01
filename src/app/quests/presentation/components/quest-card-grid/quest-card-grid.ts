import {
  Component,
  computed,
  effect,
  EventEmitter,
  input,
  Output,
  signal,
  untracked,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { QuestSummary } from '../../../application/quest-view-models';
import { QuestCard } from '../quest-card/quest-card';

@Component({
  selector: 'app-quest-card-grid',
  imports: [QuestCard, TranslatePipe],
  templateUrl: './quest-card-grid.html',
  styleUrl: './quest-card-grid.css',
})
export class QuestCardGrid {
  readonly quests = input.required<QuestSummary[]>();
  readonly selectedQuestId = input<number | null>(null);
  readonly initialPage = input(0);
  @Output() questSelected = new EventEmitter<number>();
  @Output() pageSelected = new EventEmitter<number>();

  readonly pageSize = 4;
  readonly currentPage = signal(0);

  readonly sortedQuests = computed(() =>
    [...this.quests()].sort((a, b) => {
      const statusDifference = this.getStatusOrder(a) - this.getStatusOrder(b);
      return statusDifference === 0 ? a.quest.id - b.quest.id : statusDifference;
    }),
  );

  readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.sortedQuests().length / this.pageSize)),
  );

  readonly questPages = computed(() => {
    const quests = this.sortedQuests();
    return this.pages().map((page) => {
      const start = page * this.pageSize;
      return quests.slice(start, start + this.pageSize);
    });
  });

  readonly pages = computed(() => Array.from({ length: this.pageCount() }, (_, index) => index));
  readonly trackTransform = computed(
    () =>
      `translateX(calc(-${this.currentPage() * 100}% - ${this.currentPage()} * var(--page-gap)))`,
  );

  private dragStartX: number | null = null;
  private readonly dragThreshold = 48;

  constructor() {
    effect(() => {
      this.quests();
      this.currentPage.set(this.clampPage(untracked(() => this.initialPage())));
    });

    effect(() => {
      this.currentPage.set(this.clampPage(this.initialPage()));
    });
  }

  selectQuest(questId: number): void {
    this.questSelected.emit(questId);
  }

  selectPage(page: number): void {
    const nextPage = this.clampPage(page);
    this.currentPage.set(nextPage);
    this.pageSelected.emit(nextPage);
  }

  nextPage(): void {
    this.selectPage(this.currentPage() + 1);
  }

  previousPage(): void {
    this.selectPage(this.currentPage() - 1);
  }

  onWheel(event: WheelEvent): void {
    if (this.pageCount() <= 1) {
      return;
    }

    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (Math.abs(delta) < 10) {
      return;
    }

    event.preventDefault();
    delta > 0 ? this.nextPage() : this.previousPage();
  }

  onPointerDown(event: PointerEvent): void {
    if (this.pageCount() <= 1) {
      return;
    }

    this.dragStartX = event.clientX;
  }

  onPointerUp(event: PointerEvent): void {
    if (this.dragStartX === null) {
      return;
    }

    const deltaX = event.clientX - this.dragStartX;
    this.dragStartX = null;

    if (Math.abs(deltaX) < this.dragThreshold) {
      return;
    }

    deltaX < 0 ? this.nextPage() : this.previousPage();
  }

  onPointerCancel(): void {
    this.dragStartX = null;
  }

  private getStatusOrder(summary: QuestSummary): number {
    if (summary.started && !summary.completed) {
      return 0;
    }
    if (summary.completed) {
      return 2;
    }
    return 1;
  }

  private clampPage(page: number): number {
    return Math.max(0, Math.min(page, this.pageCount() - 1));
  }
}
