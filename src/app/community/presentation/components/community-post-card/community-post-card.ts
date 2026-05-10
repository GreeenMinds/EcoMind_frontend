import { Component, Input } from '@angular/core';
import { CommunityPostSummary } from '../../../application/community.service';

@Component({
  selector: 'app-community-post-card',
  imports: [],
  templateUrl: './community-post-card.html',
  styleUrl: './community-post-card.css',
})
export class CommunityPostCard {
  @Input() summary!: CommunityPostSummary;

  get initials(): string {
    return (this.summary.author?.name ?? 'EM')
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  get authorName(): string {
    return this.summary.author?.name ?? 'EcoMind user';
  }
}
