import { RankingEntryResponse } from './ranking-entry-response';
import { RankingEntry } from '../domain/model/ranking-entry.entity';

/**
 * @summary Assembler that maps RankingEntryResponse to RankingEntry domain entities.
 * @author Victor Jhosef Laura Acosta
 */
export class RankingEntryAssembler {

  /**
   * @summary Maps an array of responses to domain entities.
   */
  static toEntitiesFromResponse(responseArray: RankingEntryResponse[]): RankingEntry[] {
    return responseArray.map(r => this.toEntityFromResponse(r));
  }

  /**
   * @summary Maps a single response to a domain entity.
   */
  static toEntityFromResponse(response: RankingEntryResponse): RankingEntry {
    const entry = new RankingEntry();
    entry.position    = response.position;
    entry.username    = response.username;
    entry.score       = response.score;
    entry.avatarUrl   = response.avatarUrl;
    entry.isCurrentUser = response.isCurrentUser;
    return entry;
  }
}