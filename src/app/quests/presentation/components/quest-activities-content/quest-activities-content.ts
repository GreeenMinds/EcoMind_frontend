import {Component, computed, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {map} from 'rxjs';
import {QuestsService} from '../../../application/quests.service';

@Component({
  selector: 'app-quest-activities-content',
  imports: [RouterLink],
  templateUrl: './quest-activities-content.html',
  styleUrl: './quest-activities-content.css',
})
export class QuestActivitiesContent {
  private readonly questsService = inject(QuestsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly questId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('questId')))),
    {initialValue: Number(this.route.snapshot.paramMap.get('questId'))},
  );
  readonly detail = computed(() => {
    const id = this.questId();
    return Number.isFinite(id) ? this.questsService.getQuestDetail(id)() : undefined;
  });

  readonly canCompleteQuest = computed(() => {
    const detail = this.detail();
    if (!detail) return false;

    return detail.activities.length > 0 && detail.activities.every((activity) => activity.completed);
  });

  toggleActivity(activityId: number, checked: boolean): void {
    if (checked) {
      this.questsService.completeActivity(activityId);
      return;
    }

    this.questsService.resetActivity(activityId);
  }

  completeQuest(): void {
    const detail = this.detail();
    if (!detail || !this.canCompleteQuest()) return;

    this.questsService.completeQuest(detail.quest.id);
    void this.router.navigate(['/quests', detail.quest.id, 'completed']);
  }
}
