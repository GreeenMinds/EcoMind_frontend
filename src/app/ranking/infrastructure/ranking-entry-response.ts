export interface RankingEntryResponse {
  userId: number;
  position: number;
  username: string;
  score: number;
  equippedAvatarUrl: string | null;
  equippedOverlayUrl: string | null;
  equippedOverlayType: string | null;
  isCurrentUser: boolean;
}
