import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export type CommunityPostReactionType =
  | 'like'
  | 'funny'
  | 'love'
  | 'surprise'
  | 'sad'
  | 'angry';

export interface CommunityPostReactionOption {
  type: CommunityPostReactionType;
  imageUrl: string;
  labelKey: string;
}

export const COMMUNITY_POST_REACTION_OPTIONS: CommunityPostReactionOption[] = [
  {
    type: 'like',
    imageUrl: '/assets/images/reactions/like.png',
    labelKey: 'community.reactions.types.like',
  },
  {
    type: 'funny',
    imageUrl: '/assets/images/reactions/funny.png',
    labelKey: 'community.reactions.types.funny',
  },
  {
    type: 'love',
    imageUrl: '/assets/images/reactions/love.png',
    labelKey: 'community.reactions.types.love',
  },
  {
    type: 'surprise',
    imageUrl: '/assets/images/reactions/surprise.png',
    labelKey: 'community.reactions.types.surprise',
  },
  {
    type: 'sad',
    imageUrl: '/assets/images/reactions/sad.png',
    labelKey: 'community.reactions.types.sad',
  },
  {
    type: 'angry',
    imageUrl: '/assets/images/reactions/angry.png',
    labelKey: 'community.reactions.types.angry',
  },
];

export class CommunityPostReaction implements BaseEntity {
  id: number;
  post_id: number;
  user_id: number;
  reaction_type: CommunityPostReactionType;
  created_at: string;

  constructor() {
    this.id = 0;
    this.post_id = 0;
    this.user_id = 0;
    this.reaction_type = 'like';
    this.created_at = '';
  }
}
