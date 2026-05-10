import { Component, Input } from '@angular/core';
import { CommunityPostSummary } from '../../../application/community.service';
import { CommunityPostCard } from '../community-post-card/community-post-card';

@Component({
  selector: 'app-community-feed',
  imports: [CommunityPostCard],
  templateUrl: './community-feed.html',
  styleUrl: './community-feed.css',
})
export class CommunityFeed {
  @Input() posts: CommunityPostSummary[] = [];
}
