export class FamilyAchievement {
  id: number;
  familyId: number;
  achievementId: number;
  achievementName: string;
  achievementDescription: string;
  earnedAt: string;
  newlyUnlocked: boolean;

  constructor() {
    this.id = 0;
    this.familyId = 0;
    this.achievementId = 0;
    this.achievementName = '';
    this.achievementDescription = '';
    this.earnedAt = '';
    this.newlyUnlocked = false;
  }
}
