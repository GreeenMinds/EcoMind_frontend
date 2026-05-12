import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RankingEntry } from '../domain/model/ranking-entry.entity';
import { CurrentUser } from '../../shared/application/current-user';
import { TimeApiService } from './time-api';

interface UserRow {
  id: number;
  name: string;
  ecopoints: number;
  [k: string]: any;
}
interface CosmeticRow {
  id: number;
  type: string;
  image_url: string;
  [k: string]: any;
}
interface UserCosmeticRow {
  user_id: number;
  cosmetic_id: number;
  equipped: boolean;
  [k: string]: any;
}
interface TxRow {
  id: number;
  user_id: number;
  ecopoints: number;
  created_at: string;
  [k: string]: any;
}

interface RankingData {
  users: UserRow[];
  userCosmetics: UserCosmeticRow[];
  cosmetics: CosmeticRow[];
  transactions: TxRow[];
  now: Date;
}

@Injectable({ providedIn: 'root' })
export class RankingApiService {
  private baseUrl = environment.platformProviderApiBaseUrl;
  private rankingPath = environment.platformProviderRankingEndpointPath;
  private userPath = environment.platformProviderUserEndpointPath;
  private http = inject(HttpClient);
  private currentUser = inject(CurrentUser);
  private timeApi = inject(TimeApiService);

  getAllRankingEntries(): Observable<{ now: Date; data: Map<number, RankingEntry[]> }> {
    return this.timeApi.getCurrentTime().pipe(
      switchMap((now) => {
        const ranges: Record<number, { start: Date; end: Date }> = {};
        [1, 2, 3].forEach((id) => {
          ranges[id] = this.timeApi.calculateDateRange(now, id);
        });

        return forkJoin({
          users: this.http.get<UserRow[]>(`${this.baseUrl}${this.userPath}`),
          userCosmetics: this.http.get<UserCosmeticRow[]>(`${this.baseUrl}/user_cosmetic`),
          cosmetics: this.http.get<CosmeticRow[]>(`${this.baseUrl}/cosmetic`),
          transactions: this.http.get<TxRow[]>(`${this.baseUrl}/ecopoint_transaction`),
        }).pipe(
          switchMap((raw) => this.reconcileTransactions(now, { ...raw, now })),
          map((ctx) => this.buildRankings(ranges, ctx)),
        );
      }),
    );
  }

  private reconcileTransactions(now: Date, ctx: RankingData): Observable<RankingData> {
    const reconciled: TxRow[] = [...ctx.transactions];
    const ops: Observable<any>[] = [];

    ctx.users.forEach((user: UserRow) => {
      const totalTx = ctx.transactions
        .filter((tx: TxRow) => tx.user_id === user.id)
        .reduce((s: number, tx: TxRow) => s + (tx.ecopoints ?? 0), 0);
      const diff = (user.ecopoints ?? 0) - totalTx;
      if (diff > 0) {
        ops.push(
          this.http
            .post<TxRow>(`${this.baseUrl}/ecopoint_transaction`, {
              user_id: user.id,
              ecopoints: diff,
              created_at: now.toISOString(),
            })
            .pipe(
              map((created: TxRow) => {
                reconciled.push(created);
                return created;
              }),
            ),
        );
      }
    });

    if (ops.length === 0) {
      return of({ ...ctx, transactions: reconciled });
    }

    return forkJoin(ops).pipe(map(() => ({ ...ctx, transactions: reconciled })));
  }

  private buildRankings(
    ranges: Record<number, { start: Date; end: Date }>,
    ctx: RankingData,
  ): { now: Date; data: Map<number, RankingEntry[]> } {
    const { users, userCosmetics, cosmetics, transactions, now } = ctx;
    const currentUserId = this.currentUser.getCurrentUserId();

    const userData = new Map<
      number,
      {
        username: string;
        avatarUrl: string | null;
        overlayUrl: string | null;
        overlayType: string | null;
      }
    >();

    users.forEach((user: UserRow) => {
      const equippedItems = userCosmetics.filter(
        (uc: UserCosmeticRow) => uc.user_id === user.id && uc.equipped,
      );
      const avatarCosmetic = equippedItems
        .map((uc: UserCosmeticRow) => cosmetics.find((c: CosmeticRow) => c.id === uc.cosmetic_id))
        .find((c: CosmeticRow | undefined) => c?.type === 'avatar');
      const overlayCosmetic = equippedItems
        .map((uc: UserCosmeticRow) => cosmetics.find((c: CosmeticRow) => c.id === uc.cosmetic_id))
        .find((c: CosmeticRow | undefined) => c && c.type !== 'avatar');

      userData.set(user.id, {
        username: user.name ?? 'Unknown',
        avatarUrl: avatarCosmetic?.image_url ?? null,
        overlayUrl: overlayCosmetic?.image_url ?? null,
        overlayType: overlayCosmetic?.type ?? null,
      });
    });

    const result = new Map<number, RankingEntry[]>();

    [1, 2, 3].forEach((id) => {
      const scores = new Map<number, number>();
      if (id === 1) {
        users.forEach((u: UserRow) => scores.set(u.id, u.ecopoints ?? 0));
      } else {
        const range = ranges[id];
        const filtered = transactions.filter((tx: TxRow) => {
          const d = new Date(tx.created_at);
          return d >= range.start && d <= range.end;
        });
        users.forEach((u: UserRow) => {
          const sum = filtered
            .filter((tx: TxRow) => tx.user_id === u.id)
            .reduce((acc: number, tx: TxRow) => acc + (tx.ecopoints ?? 0), 0);
          scores.set(u.id, sum);
        });
      }

      const entries = users
        .map((user: UserRow) => {
          const d = userData.get(user.id)!;
          const entry = new RankingEntry();
          entry.userId = user.id;
          entry.username = d.username;
          entry.score = scores.get(user.id) ?? 0;
          entry.equippedAvatarUrl = d.avatarUrl;
          entry.equippedOverlayUrl = d.overlayUrl;
          entry.equippedOverlayType = d.overlayType;
          entry.isCurrentUser = user.id === currentUserId;
          return entry;
        })
        .sort((a: RankingEntry, b: RankingEntry) => b.score - a.score)
        .map((entry: RankingEntry, index: number) => {
          entry.position = index + 1;
          return entry;
        });
      result.set(id, entries);
    });

    return { now, data: result };
  }

  getRankings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}${this.rankingPath}`);
  }
}
