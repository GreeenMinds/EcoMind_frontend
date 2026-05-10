/**
 * @summary Domain entity representing a user's ranking entry.
 * @author Victor Jhosef Laura Acosta
 */
export class RankingEntry {
  position: number;
  username: string;
  score: number;
  avatarUrl: string;
  isCurrentUser: boolean;

  constructor() {
    this.position = 0;
    this.username = '';
    this.score = 0;
    this.avatarUrl = '';
    this.isCurrentUser = false;
  }
}