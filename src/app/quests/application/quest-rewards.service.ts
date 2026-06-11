import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { retry } from 'rxjs';
import { MonetizationStoreService } from '../../monetization/application/monetization-store.service';
import { ProfileService } from '../../profile/application/profile.service';
import { User } from '../../profile/domain/model/user.entity';
import { Quest } from '../domain/model/quest.entity';
import { QuestsService } from './quests.service';

@Injectable({
  providedIn: 'root',
})
export class QuestRewardsService {
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly questsService: QuestsService,
    private readonly profileService: ProfileService,
    private readonly monetizationStoreService: MonetizationStoreService,
  ) {}

  shouldAwardQuestReward(quest: Quest, userId: number): boolean {
    if (quest.type === 'minigame') {
      return true;
    }

    return !this.questsService
      .questsUser()
      .some(
        (questUser) =>
          questUser.quest_id === quest.id &&
          questUser.user_id === userId &&
          questUser.status === 'completed',
      );
  }

  giveQuestRewards(quest: Quest, userIds: number[], fallbackMessage: string, onSuccess: (users: User[]) => void): void {
    const uniqueUserIds = [...new Set(userIds)];

    if (uniqueUserIds.length === 0 || (quest.reward_gems === 0 && quest.reward_ecopoints === 0)) {
      onSuccess([]);
      return;
    }

    const currentUserId = this.questsService.currentUserId();
    const multiplierFactor = this.monetizationStoreService.activeMultiplierFactor();
    const todayDate = this.questsService.getTodayDate();
    const updatedUsers: User[] = [];

    const updateNextUser = (index: number) => {
      if (index >= uniqueUserIds.length) {
        onSuccess(updatedUsers);
        return;
      }

      const userId = uniqueUserIds[index];

      const ecopointsAmount = Math.round(
        quest.reward_ecopoints * (userId === currentUserId ? multiplierFactor : 1),
      );
      const gemAmount = quest.reward_gems;

      const profileReward$ = this.profileService.awardQuestRewards(
        userId,
        gemAmount,
        ecopointsAmount,
        todayDate,
      );

      profileReward$.pipe(retry(2), takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (updatedUser) => {
          if (gemAmount > 0) {
            this.monetizationStoreService.onQuestGemsAwarded(
              userId,
              gemAmount,
              quest.id,
              updatedUser.gem_balance,
            );
          }

          updatedUsers.push(updatedUser);
          updateNextUser(index + 1);
        },
        error: (error) => {
          this.questsService.errorSignal.set(this.questsService.formatError(error, fallbackMessage));
          this.questsService.loadingSignal.set(false);
        },
      });
    };

    updateNextUser(0);
  }

  mergeRewardedUsers(users: User[]): void {
    if (users.length === 0) {
      return;
    }

    this.questsService.usersSignal.update((existing) =>
      this.questsService.mergeById(existing, users),
    );
    users.forEach((user) => this.profileService.syncUser(user));
  }
}
