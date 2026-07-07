import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export class Quest implements BaseEntity {
  id: number;
  minigameId: number | null;
  category: string;
  title: string;
  description: string;
  imageUrl: string | null;
  age: number;
  type: string;
  rewardGems: number;
  rewardEcopoints: number;
  assignedDate: string | null;
  time: number;
  themeType: string;
  status: string;
  progress: number;
  started: boolean;
  completed: boolean;
  hasCompletedAttempt: boolean;

  constructor(quest: {
    id: number;
    minigameId: number | null;
    category: string;
    title: string;
    description: string;
    imageUrl: string | null;
    age: number;
    type: string;
    rewardGems: number;
    rewardEcopoints: number;
    assignedDate: string | null;
    time: number;
    themeType?: string;
    status?: string;
    progress?: number;
    started?: boolean;
    completed?: boolean;
    hasCompletedAttempt?: boolean;
  }) {
    this.id = quest.id;
    this.minigameId = quest.minigameId;
    this.category = quest.category;
    this.title = quest.title;
    this.description = quest.description;
    this.imageUrl = quest.imageUrl;
    this.age = quest.age;
    this.type = quest.type;
    this.rewardGems = quest.rewardGems;
    this.rewardEcopoints = quest.rewardEcopoints;
    this.assignedDate = quest.assignedDate;
    this.time = quest.time;
    this.themeType = quest.themeType ?? quest.type;
    this.status = quest.status ?? 'PENDING';
    this.progress = quest.progress ?? 0;
    this.started = quest.started ?? false;
    this.completed = quest.completed ?? false;
    this.hasCompletedAttempt = quest.hasCompletedAttempt ?? false;
  }

  get minigame_id(): number | null {
    return this.minigameId;
  }

  set minigame_id(value: number | null) {
    this.minigameId = value;
  }

  get image_url(): string | null {
    return this.imageUrl;
  }

  set image_url(value: string | null) {
    this.imageUrl = value;
  }

  get reward_gems(): number {
    return this.rewardGems;
  }

  set reward_gems(value: number) {
    this.rewardGems = value;
  }

  get reward_ecopoints(): number {
    return this.rewardEcopoints;
  }

  set reward_ecopoints(value: number) {
    this.rewardEcopoints = value;
  }

  get expiration_date(): string | null {
    return this.assignedDate;
  }

  set expiration_date(value: string | null) {
    this.assignedDate = value;
  }

  get theme_type(): string {
    return this.themeType;
  }

  set theme_type(value: string) {
    this.themeType = value;
  }

  get has_completed_attempt(): boolean {
    return this.hasCompletedAttempt;
  }

  set has_completed_attempt(value: boolean) {
    this.hasCompletedAttempt = value;
  }
}
