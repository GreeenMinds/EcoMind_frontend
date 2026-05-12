import { Component, Input } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CommunityPostSummary } from '../../../application/community.service';

@Component({
  selector: 'app-community-post-card',
  imports: [TranslatePipe],
  templateUrl: './community-post-card.html',
  styleUrl: './community-post-card.css',
})
export class CommunityPostCard {
  @Input() summary!: CommunityPostSummary;

  constructor(private readonly translate: TranslateService) {}

  get initials(): string {
    return (this.summary.author?.name ?? 'EM')
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  get authorName(): string {
    return this.summary.author?.name ?? this.translate.instant('community.post.defaultAuthor');
  }
}
