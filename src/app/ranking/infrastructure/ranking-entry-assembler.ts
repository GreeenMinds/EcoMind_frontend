import { RankingEntryResponse } from './ranking-entry-response';
import { RankingEntry } from '../domain/model/ranking-entry.entity';

export class RankingEntryAssembler {
  static toEntitiesFromResponse(responseArray: RankingEntryResponse[]): RankingEntry[] {
    return responseArray.map((r) => this.toEntityFromResponse(r));
  }

  static toEntityFromResponse(response: RankingEntryResponse): RankingEntry {
    const entry = new RankingEntry();
    entry.userId = response.userId;
    entry.position = response.position;
    entry.username = response.username;
    entry.score = response.score;
    entry.equippedAvatarUrl = response.equippedAvatarUrl;
    entry.equippedOverlayUrl = response.equippedOverlayUrl;
    entry.equippedOverlayType = response.equippedOverlayType;
    entry.isCurrentUser = response.isCurrentUser;
    return entry;
  }
}
