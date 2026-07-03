import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MonetizationStoreService } from '../../../../monetization/application/monetization-store.service';
import { ProfileAvatar } from '../../../../profile/presentation/components/profile-avatar/profile-avatar';
import {
  CommunityPostReactionSummary,
  CommunityPostSummary,
} from '../../../application/community.service';
import {
  COMMUNITY_POST_REACTION_OPTIONS,
  CommunityPostReactionOption,
  CommunityPostReactionType,
} from '../../../domain/model/community-post-reaction.entity';

type ReactionDetailFilter = CommunityPostReactionType | 'all';

@Component({
  selector: 'app-community-post-card',
  imports: [ProfileAvatar, TranslatePipe],
  templateUrl: './community-post-card.html',
  styleUrl: './community-post-card.css',
})
export class CommunityPostCard {
  private readonly monetizationStore = inject(MonetizationStoreService);
  readonly reactionOptions = COMMUNITY_POST_REACTION_OPTIONS;
  readonly showReactionPicker = signal(false);
  readonly showReactionDetails = signal(false);
  readonly selectedReactionDetailFilter = signal<ReactionDetailFilter>('all');

  @Input() summary!: CommunityPostSummary;
  @Output() selectReaction = new EventEmitter<{
    postId: number;
    reactionType: CommunityPostReactionType;
  }>();

  constructor(private readonly translate: TranslateService) {}

  get authorName(): string {
    return this.summary.author?.name ?? this.translate.instant('community.post.defaultAuthor');
  }

  get authorId(): number | null {
    return this.summary.author?.id ?? this.summary.post.user_id ?? null;
  }

  get avatarUrl(): string | null {
    return this.authorId ? this.monetizationStore.getEquippedAvatarUrlForUser(this.authorId) : null;
  }

  get overlayUrl(): string | null {
    return this.authorId ? this.monetizationStore.getEquippedOverlayUrlForUser(this.authorId) : null;
  }

  get overlayType(): string | null {
    return this.authorId ? this.monetizationStore.getEquippedOverlayTypeForUser(this.authorId) : null;
  }

  get activeReactionOption(): CommunityPostReactionOption | undefined {
    return this.reactionOptions.find(
      (option) => option.type === this.summary.currentUserReaction?.reaction_type,
    );
  }

  get totalReactions(): number {
    return this.summary.post.likes;
  }

  get filteredReactionSummaries(): CommunityPostReactionSummary[] {
    const selectedFilter = this.selectedReactionDetailFilter();

    if (selectedFilter === 'all') {
      return this.summary.reactions;
    }

    return this.summary.reactions.filter(
      (reactionSummary) => reactionSummary.reaction.reaction_type === selectedFilter,
    );
  }

  toggleReactionPicker(): void {
    this.showReactionPicker.update((value) => !value);
  }

  chooseReaction(reactionType: CommunityPostReactionType): void {
    this.selectReaction.emit({
      postId: this.summary.post.id,
      reactionType,
    });
    this.showReactionPicker.set(false);
  }

  openReactionDetails(): void {
    if (this.totalReactions > 0) {
      this.showReactionDetails.set(true);
    }
  }

  closeReactionDetails(): void {
    this.showReactionDetails.set(false);
    this.selectedReactionDetailFilter.set('all');
  }

  selectReactionDetailFilter(filter: ReactionDetailFilter): void {
    this.selectedReactionDetailFilter.set(filter);
  }

  getReactionDetailFilterCount(filter: ReactionDetailFilter): number {
    if (filter === 'all') {
      return this.summary.reactions.length;
    }

    return this.summary.reactions.filter(
      (reactionSummary) => reactionSummary.reaction.reaction_type === filter,
    ).length;
  }
}
