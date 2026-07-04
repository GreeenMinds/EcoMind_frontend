import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { QuestsService } from '../../../application/quests.service';

@Component({
  selector: 'app-family-plan-panel',
  imports: [RouterLink],
  templateUrl: './family-plan-panel.html',
  styleUrl: './family-plan-panel.css',
})
export class FamilyPlanPanel {
  private readonly questsService = inject(QuestsService);
  private readonly router = inject(Router);

  readonly membership = this.questsService.familyMembership;
  readonly activePlan = this.questsService.activeFamilyPlan;
  readonly draftPlan = this.questsService.draftFamilyPlan;
  readonly isParent = this.questsService.isFamilyParent;
  readonly progress = computed(() => Math.round(this.activePlan()?.progress ?? 0));

  readonly shouldShow = computed(() =>
    Boolean(this.membership() && (this.activePlan() || this.isParent())),
  );

  createPlan(): void {
    this.questsService.ensureFamilyPlanDraft().subscribe({
      next: () => void this.router.navigate(['/quests/family-plans/new']),
    });
  }
}
