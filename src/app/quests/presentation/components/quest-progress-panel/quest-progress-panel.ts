import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { QuestsService } from '../../../application/quests.service';
import { Quest } from '../../../domain/model/quest.entity';
import { QuestProgressService } from '../../../application/quest-progress.service';

type ProgressPanelItem = {
  questId: number;
  label: string;
  progress: number;
  route: (string | number)[];
  canAbandon: boolean;
};

@Component({
  selector: 'app-quest-progress-panel',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './quest-progress-panel.html',
  styleUrl: './quest-progress-panel.css',
})
export class QuestProgressPanel {
  private readonly questsService = inject(QuestsService);
  private readonly questProgressService = inject(QuestProgressService);

  readonly maxProgressItems = 4;
  readonly modalOpen = signal(false);
  readonly abandonConfirmation = signal<ProgressPanelItem | null>(null);

  private readonly activeProgressSummaries = computed(() =>
    this.pickProgressQuests(this.getVisibleProgressQuests()),
  );

  readonly progressItems = computed<ProgressPanelItem[]>(() => {
    return this.activeProgressSummaries()
      .slice(0, this.maxProgressItems)
      .map((summary) => this.toProgressPanelItem(summary));
  });

  readonly allProgressItems = computed<ProgressPanelItem[]>(() =>
    this.activeProgressSummaries().map((summary) => this.toProgressPanelItem(summary)),
  );

  readonly hasMoreProgressItems = computed(
    () => this.activeProgressSummaries().length > this.maxProgressItems,
  );

  openModal(): void {
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  requestAbandon(item: ProgressPanelItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.abandonConfirmation.set(item);
  }

  closeAbandonConfirmation(): void {
    this.abandonConfirmation.set(null);
  }

  confirmAbandon(): void {
    const item = this.abandonConfirmation();
    if (!item) {
      return;
    }

    this.questProgressService.deleteQuestProgress(item.questId);
    this.abandonConfirmation.set(null);
  }

  private pickProgressQuests(quests: Quest[]): Quest[] {
    return quests.sort((a, b) => {
      const categoryOrder = this.getCategoryOrder(a.category) - this.getCategoryOrder(b.category);
      return categoryOrder === 0 ? a.id - b.id : categoryOrder;
    });
  }

  private getVisibleProgressQuests(): Quest[] {
    const activeQuests = this.questsService
      .quests()
      .filter((quest) => quest.type !== 'FAMILY' && quest.started && !quest.completed);
    const activeIds = new Set(activeQuests.map((quest) => quest.id));
    const pendingCollaborativeQuestIds = new Set(
      this.questsService
        .collaborativeSessions()
        .filter((session) => session.status === 'PENDING')
        .filter((session) =>
          this.questsService.collaborativeMembers().some(
            (member) =>
              member.session_id === session.id &&
              member.user_id === this.questsService.currentUserId() &&
              member.status === 'ACCEPTED',
          ),
        )
        .map((session) => session.quest_id),
    );
    const pendingCollaborativeQuests = this.questsService
      .quests()
      .filter(
        (quest) =>
          quest.type !== 'FAMILY' &&
          pendingCollaborativeQuestIds.has(quest.id) &&
          !activeIds.has(quest.id) &&
          !quest.completed,
      );

    return [...activeQuests, ...pendingCollaborativeQuests];
  }

  private getCategoryOrder(category: string): number {
    if (category === 'DAILY_QUEST') {
      return 0;
    }
    return 1;
  }

  private getProgressItemRoute(quest: Quest): (string | number)[] {
    if (quest.type === 'ACTIVITIES') {
      return ['/quests', quest.id, 'activities'];
    }

    return ['/quests', quest.id];
  }

  private toProgressPanelItem(quest: Quest): ProgressPanelItem {
    return {
      questId: quest.id,
      label: quest.title,
      progress: Math.round(quest.progress),
      route: this.getProgressItemRoute(quest),
      canAbandon: true,
    };
  }
}
