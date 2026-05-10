/**
 * @summary Represents the raw ranking entry object from the API response.
 * @author Victor Jhosef Laura Acosta
 */
export interface RankingEntryResponse {
  position: number;
  username: string;
  score: number;
  avatarUrl: string;
  isCurrentUser: boolean;
}