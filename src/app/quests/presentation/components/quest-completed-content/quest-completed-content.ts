import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';
import { QuestsService } from '../../../application/quests.service';

@Component({
  selector: 'app-quest-completed-content',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './quest-completed-content.html',
  styleUrl: './quest-completed-content.css',
})
export class QuestCompletedContent {
  private readonly questsService = inject(QuestsService);
  private readonly route = inject(ActivatedRoute);

  readonly imageSrc = '/assets/images/quests/activity-completed.png';
  readonly questId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('questId')))),
    { initialValue: Number(this.route.snapshot.paramMap.get('questId')) },
  );
  readonly detail = computed(() => {
    const id = this.questId();
    const quest = Number.isFinite(id) ? this.questsService.getQuestById(id)() : undefined;
    return quest ? { quest } : undefined;
  });
}
