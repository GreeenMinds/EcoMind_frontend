export class FamilyRankingEntry {
  familyId: number;
  familyName: string;
  totalEcopoints: number;
  position: number;

  constructor() {
    this.familyId = 0;
    this.familyName = '';
    this.totalEcopoints = 0;
    this.position = 0;
  }
}
