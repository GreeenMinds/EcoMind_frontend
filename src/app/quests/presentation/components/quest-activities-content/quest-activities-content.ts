import { Component, computed, inject } from '@angular/core';
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

  readonly questId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('questId')))),
    { initialValue: Number(this.route.snapshot.paramMap.get('questId')) },
  );
  readonly detail = computed(() => {
    const id = this.questId();
    const quest = Number.isFinite(id) ? this.questsService.getQuestById(id)() : undefined;
    if (!quest) return undefined;

    const session = this.questsService
      .collaborativeSessions()
      .filter((item) => item.quest_id === quest.id && ['pending', 'started'].includes(item.status))
      .filter((item) =>
        this.questsService
          .collaborativeMembers()
          .some(
            (member) =>
              member.session_id === item.id &&
              member.user_id === this.questsService.currentUserId() &&
              member.status === 'accepted',
          ),
      )
      .sort((a, b) => b.id - a.id)[0];
    const sessionId = session?.id ?? null;
    const acceptedUserIds = this.questsService
      .collaborativeMembers()
      .filter((member) => member.session_id === sessionId && member.status === 'accepted')
      .map((member) => member.user_id);
    const activities = this.questsService
      .activities()
      .filter((activity) => activity.quest_id === quest.id)
      .sort((a, b) => a.order - b.order)
      .map((activity) => {
        const progress =
          sessionId === null
            ? (this.questsService
                .activitiesUser()
                .find(
                  (activityUser) =>
                    activityUser.activity_id === activity.id &&
                    activityUser.user_id === this.questsService.currentUserId() &&
                    activityUser.collaborative_session_id === null,
                )?.progress ?? 0)
            : this.questsService
                .activitiesUser()
                .filter(
                  (activityUser) =>
                    activityUser.activity_id === activity.id &&
                    activityUser.collaborative_session_id === sessionId &&
                    acceptedUserIds.includes(activityUser.user_id),
                )
                .reduce((highest, activityUser) => Math.max(highest, activityUser.progress), 0);

        return {
          activity,
          progress,
          completed: progress >= 100,
        };
      });

    return { quest, activities };
  });

  readonly canCompleteQuest = computed(() => {
    const detail = this.detail();
    if (!detail) return false;

    return (
      detail.activities.length > 0 && detail.activities.every((activity) => activity.completed)
    );
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

    this.questProgressService.updateQuestCompleted(detail.quest.id);
    void this.router.navigate(['/quests', detail.quest.id, 'completed']);
  }
}
