import { Component, computed, effect, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';
import { QuestsService } from '../../../application/quests.service';

@Component({
  selector: 'app-family-plan-detail',
  imports: [RouterLink, DecimalPipe, TranslatePipe],
  templateUrl: './family-plan-detail.html',
  styleUrl: './family-plan-detail.css',
})
export class FamilyPlanDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly questsService = inject(QuestsService);
  readonly completionCelebration = signal<{
    gems: number;
    ecopoints: number;
    showRewards: boolean;
  } | null>(null);

  readonly planId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('planId')))),
    { initialValue: Number(this.route.snapshot.paramMap.get('planId')) },
  );

  readonly plan = computed(() =>
    this.questsService.familyPlans().find((item) => item.id === this.planId()) ??
    (this.questsService.activeFamilyPlan()?.id === this.planId()
      ? this.questsService.activeFamilyPlan()
      : null),
  );

  readonly progress = computed(() => Math.round(this.plan()?.progress ?? 0));
  readonly totalItems = computed(() => this.plan()?.items.length ?? 0);
  readonly completedItems = computed(
    () => this.plan()?.items.filter((item) => item.progress >= 100).length ?? 0,
  );
  readonly canCompletePlan = computed(() => {
    const plan = this.plan();
    return Boolean(
      plan &&
        plan.status === 'ACTIVE' &&
        this.questsService.isFamilyParent() &&
        plan.items.length > 0 &&
        plan.items.every((item) => item.progress >= 100),
    );
  });
  readonly statusKey = computed(() => {
    const status = this.plan()?.status;
    return status ? `quests.familyPlan.statuses.${status}` : '';
  });

  constructor() {
    effect(() => {
      const id = this.planId();
      if (Number.isFinite(id)) {
        this.questsService.loadFamilyPlanById(id);
        this.questsService.searchQuests({
          title: null,
          category: null,
          questType: 'FAMILY',
          age: null,
          type: null,
        });
      }
    });
  }

  getQuestTitle(questId: number): string {
    return this.questsService.getQuestById(questId)()?.title ?? `Reto #${questId}`;
  }

  getQuestDescription(questId: number): string {
    return this.questsService.getQuestById(questId)()?.description ?? '';
  }

  getActivityRoute(questId: number): (string | number)[] {
    return ['/quests', questId, 'activities'];
  }

  getActivityQueryParams(): { returnUrl: string } {
    return { returnUrl: `/quests/family-plans/${this.planId()}` };
  }

  deletePlan(): void {
    const plan = this.plan();
    if (!plan) {
      return;
    }

    this.questsService.deleteFamilyPlan(plan.id);
    void this.router.navigate(['/quests']);
  }

  completePlan(): void {
    const plan = this.plan();
    if (!plan || !this.canCompletePlan()) {
      return;
    }

    const rewards = this.calculatePendingRewards(plan);
    this.questsService.completeFamilyPlan(plan.id).subscribe({
      next: () => {
        this.completionCelebration.set({
          ...rewards,
          showRewards: rewards.gems > 0 || rewards.ecopoints > 0,
        });
      },
    });
  }

  continueAfterCompletion(): void {
    void this.router.navigate(['/quests']);
  }

  private calculatePendingRewards(plan: NonNullable<ReturnType<typeof this.plan>>): {
    gems: number;
    ecopoints: number;
  } {
    return plan.items.reduce(
      (total, item) => {
        const quest = this.questsService.getQuestById(item.questId)();
        const currentQuestUser = this.questsService.questsUser().find(
          (questUser) =>
            questUser.user_id === this.questsService.currentUserId() &&
            questUser.quest_id === item.questId &&
            questUser.collaborative_session_id === item.collaborativeSessionId,
        );

        if (!quest || currentQuestUser?.status === 'COMPLETED') {
          return total;
        }

        return {
          gems: total.gems + quest.rewardGems,
          ecopoints: total.ecopoints + quest.rewardEcopoints,
        };
      },
      { gems: 0, ecopoints: 0 },
    );
  }
}
