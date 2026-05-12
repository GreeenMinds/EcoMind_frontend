export class RankingEntry {
  userId: number;
  position: number;
  username: string;
  score: number;
  equippedAvatarUrl: string | null;
  equippedOverlayUrl: string | null;
  equippedOverlayType: string | null;
  isCurrentUser: boolean;

  constructor() {
    this.userId = 0;
    this.position = 0;
    this.username = '';
    this.score = 0;
    this.equippedAvatarUrl = null;
    this.equippedOverlayUrl = null;
    this.equippedOverlayType = null;
    this.isCurrentUser = false;
  }
}