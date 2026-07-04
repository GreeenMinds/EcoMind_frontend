import { Component, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { RankingContent } from './ranking-content';
import { FamilyRankingContent } from './family-ranking-content';

type RankingScope = 'individual' | 'family';

@Component({
  selector: 'app-ranking-hub-content',
  standalone: true,
  imports: [TranslateModule, RankingContent, FamilyRankingContent],
  templateUrl: './ranking-hub-content.html',
  styleUrl: './ranking-hub-content.css',
})
export class RankingHubContent {
  readonly scope = signal<RankingScope>('individual');

  selectScope(scope: RankingScope): void {
    this.scope.set(scope);
  }
}
