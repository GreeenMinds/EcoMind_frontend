import { Component, HostListener, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QuestsApi } from '../../../infrastructure/quests-api';
import { CurrentUser } from '../../../../shared/application/current-user';
import { MinigameAttempt } from '../../../domain/model/minigame-attempt.entity';
import { environment } from '../../../../../environments/environment';
import { QuestsService } from '../../../application/quests.service';

const TARGET_SCORE = 800;
const POINTS_PER_CLICK = 100;

@Component({
  selector: 'app-simple-score-minigame',
  templateUrl: './simple-score-minigame.html',
  styleUrl: './simple-score-minigame.css',
})
export class SimpleScoreMinigame implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly questsApi = inject(QuestsApi);
  private readonly questsService = inject(QuestsService);
  private readonly currentUser = inject(CurrentUser);
  private readonly startedAt = Date.now();

  readonly targetScore = TARGET_SCORE;
  readonly score = signal(0);
  readonly clicks = signal(0);
  readonly attempt = signal<MinigameAttempt | null>(null);
  readonly loading = signal(true);
  readonly finishing = signal(false);
  readonly finished = signal(false);
  readonly error = signal<string | null>(null);
  readonly progress = computed(() => Math.min(100, Math.round((this.score() / TARGET_SCORE) * 100)));
  readonly canFinish = computed(() => Boolean(this.attempt()) && !this.loading() && !this.finishing());
  readonly rewardGems = computed(() => this.attempt()?.givenGems ?? 0);
  readonly rewardEcopoints = computed(() => this.attempt()?.givenEcopoints ?? 0);
  readonly hasRewards = computed(() => this.rewardGems() > 0 || this.rewardEcopoints() > 0);

  private questId: number | null = null;
  private cancelRequested = false;

  ngOnInit(): void {
    const questId = Number(this.route.snapshot.queryParamMap.get('questId'));
    if (!Number.isFinite(questId) || questId <= 0) {
      this.error.set('No se encontro la quest del minijuego.');
      this.loading.set(false);
      return;
    }

    this.questId = questId;
    this.questsApi
      .createMinigameAttempt({
        questId,
        userId: this.currentUser.getCurrentUserId(),
      })
      .subscribe({
        next: (attempt) => {
          this.attempt.set(attempt);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudo iniciar el intento.');
          this.loading.set(false);
        },
      });
  }

  ngOnDestroy(): void {
    this.cancelAttempt();
  }

  @HostListener('window:beforeunload')
  handleBeforeUnload(): void {
    this.cancelAttemptOnUnload();
  }

  collect(): void {
    if (!this.attempt() || this.finished()) return;
    this.clicks.update((value) => value + 1);
    this.score.update((value) => value + POINTS_PER_CLICK);
  }

  finish(): void {
    const attempt = this.attempt();
    if (!attempt || this.finishing() || this.finished()) return;

    this.finishing.set(true);
    this.error.set(null);
    this.questsApi
      .finishMinigameAttempt(attempt.id, {
        score: this.score(),
        metadata: {
          targetScore: TARGET_SCORE,
          clicks: this.clicks(),
          durationSeconds: Math.round((Date.now() - this.startedAt) / 1000),
        },
      })
      .subscribe({
        next: (finishedAttempt) => {
          this.finished.set(true);
          this.cancelRequested = true;
          this.attempt.set(finishedAttempt);
          this.questsService.replaceMinigameAttempt(finishedAttempt);
          this.questsService.refreshCurrentUserProfile();
          this.finishing.set(false);
        },
        error: () => {
          this.error.set('No se pudo enviar el resultado.');
          this.finishing.set(false);
        },
      });
  }

  backToQuest(): void {
    const target = this.questId ? ['/quests', this.questId] : ['/quests'];
    if (this.shouldCancelAttempt()) {
      this.cancelRequested = true;
      this.questsApi.cancelMinigameAttempt(this.attempt()!.id).subscribe({
        next: () => void this.router.navigate(target),
        error: () => void this.router.navigate(target),
      });
      return;
    }

    void this.router.navigate(target);
  }

  continueToQuests(): void {
    void this.router.navigate(['/quests']);
  }

  private cancelAttempt(): void {
    if (!this.shouldCancelAttempt()) return;

    this.cancelRequested = true;
    this.questsApi.cancelMinigameAttempt(this.attempt()!.id).subscribe();
  }

  private cancelAttemptOnUnload(): void {
    if (!this.shouldCancelAttempt()) return;

    this.cancelRequested = true;
    const cancelUrl = `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderMinigameAttemptEndpointPath}/${this.attempt()!.id}/cancel`;
    void fetch(cancelUrl, {
      method: 'POST',
      keepalive: true,
    });
  }

  private shouldCancelAttempt(): boolean {
    const attempt = this.attempt();
    return Boolean(
      attempt &&
      attempt.status === 'STARTED' &&
      !this.finished() &&
      !this.cancelRequested,
    );
  }
}
