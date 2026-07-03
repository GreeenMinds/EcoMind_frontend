import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';
import { QuestsService } from '../../../application/quests.service';
import { QuestProgressService } from '../../../application/quest-progress.service';

@Component({
  selector: 'app-quest-activities-content',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './quest-activities-content.html',
  styleUrl: './quest-activities-content.css',
})
export class QuestActivitiesContent {
  private readonly questsService = inject(QuestsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly questProgressService = inject(QuestProgressService);
  private readonly requestedActivityUsers = new Set<number>();

  readonly questId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('questId')))),
    { initialValue: Number(this.route.snapshot.paramMap.get('questId')) },
  );

  constructor() {
    effect(() => {
      const id = this.questId();
      if (Number.isFinite(id)) {
        this.questsService.loadActivitiesByQuestId(id);
      }
    });

    effect(() => {
      const detail = this.detail();
      if (!detail?.questUser) {
        return;
      }

      const assignedActivityIds = new Set(
        this.questsService
          .activitiesUser()
          .filter((activityUser) => activityUser.quest_user_id === detail.questUser!.id)
          .map((activityUser) => activityUser.activity_id),
      );
      const missingAssignments = detail.activities.some(
        (activityProgress) => !assignedActivityIds.has(activityProgress.activity.id),
      );

      if (missingAssignments && !this.requestedActivityUsers.has(detail.questUser.id)) {
        this.requestedActivityUsers.add(detail.questUser.id);
        this.questsService.loadActivityUsersByQuestUserId(detail.questUser.id);
      }
    });
  }

  readonly detail = computed(() => {
    const id = this.questId();
    const quest = Number.isFinite(id) ? this.questsService.getQuestById(id)() : undefined;
    if (!quest) return undefined;

    const session = this.questsService
      .collaborativeSessions()
      .filter((item) => item.quest_id === quest.id && ['PENDING', 'STARTED'].includes(item.status))
      .filter((item) =>
        this.questsService
          .collaborativeMembers()
          .some(
            (member) =>
              member.session_id === item.id &&
              member.user_id === this.questsService.currentUserId() &&
              member.status === 'ACCEPTED',
          ),
      )
      .sort((a, b) => b.id - a.id)[0];
    const sessionId = session?.id ?? null;
    const questUser = this.questsService.findActiveQuestForSession(quest.id, sessionId);
    const activities = this.questsService
      .activities()
      .filter((activity) => activity.quest_id === quest.id)
      .sort((a, b) => a.order - b.order)
      .map((activity) => {
        const progress =
          this.questsService
            .activitiesUser()
            .find(
              (activityUser) =>
                activityUser.activity_id === activity.id &&
                activityUser.quest_user_id === questUser?.id,
            )?.progress ?? 0;

        return {
          activity,
          progress,
          completed: progress >= 100,
        };
      });

    return {
      quest,
      questUser,
      activities,
      progress: questUser?.progress ?? quest.progress,
      started: Boolean(questUser && questUser.status !== 'COMPLETED'),
      completed: questUser?.status === 'COMPLETED',
      status: questUser?.status ?? quest.status,
    };
  });

  readonly canCompleteQuest = computed(() => {
    const detail = this.detail();
    if (!detail) return false;

    return detail.status === 'READY_TO_COMPLETE';
  });

  toggleActivity(activityId: number, checked: boolean): void {
    if (checked) {
      this.questProgressService.updateActivityProgress(activityId, 100);
      return;
    }

    this.questProgressService.updateActivityProgress(activityId, 0);
  }

  completeQuest(): void {
    const detail = this.detail();
    if (!detail || !this.canCompleteQuest()) return;

    this.questProgressService.updateQuestCompleted(detail.quest.id).subscribe({
      next: () => void this.router.navigate(['/quests', detail.quest.id, 'completed']),
    });
  }
}
