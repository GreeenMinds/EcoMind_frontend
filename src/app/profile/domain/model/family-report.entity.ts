export class CompletedQuest {
  questTitle: string;
  completedAt: string;
  ecopoints: number;
  activityCount: number;

  constructor() {
    this.questTitle = '';
    this.completedAt = '';
    this.ecopoints = 0;
    this.activityCount = 0;
  }
}

export class FamilyReport {
  familyId: number;
  hasData: boolean;
  completedQuestsThisWeek: number;
  completedQuests: CompletedQuest[];
  achievementsEarned: number;
  totalAchievements: number;

  constructor() {
    this.familyId = 0;
    this.hasData = false;
    this.completedQuestsThisWeek = 0;
    this.completedQuests = [];
    this.achievementsEarned = 0;
    this.totalAchievements = 0;
  }
}
