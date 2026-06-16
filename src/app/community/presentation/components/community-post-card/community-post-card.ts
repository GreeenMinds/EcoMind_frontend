import { Component, inject, Input } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MonetizationStoreService } from '../../../../monetization/application/monetization-store.service';
import { ProfileAvatar } from '../../../../profile/presentation/components/profile-avatar/profile-avatar';
import { CommunityPostSummary } from '../../../application/community.service';

@Component({
  selector: 'app-community-post-card',
  imports: [ProfileAvatar, TranslatePipe],
  templateUrl: './community-post-card.html',
  styleUrl: './community-post-card.css',
})
export class CommunityPostCard {
  private readonly monetizationStore = inject(MonetizationStoreService);

  @Input() summary!: CommunityPostSummary;

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
}
