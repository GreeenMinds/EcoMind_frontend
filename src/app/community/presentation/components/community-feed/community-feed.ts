import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CommunityPostSummary } from '../../../application/community.service';
import { CommunityPostCard } from '../community-post-card/community-post-card';

@Component({
  selector: 'app-community-feed',
  imports: [CommunityPostCard, TranslatePipe],
  templateUrl: './community-feed.html',
  styleUrl: './community-feed.css',
})
export class CommunityFeed {
  @Input() posts: CommunityPostSummary[] = [];
  @Output() createPost = new EventEmitter<void>();
}
