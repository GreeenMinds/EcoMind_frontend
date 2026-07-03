import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export class MinigameAttempt implements BaseEntity {
  id: number;
  userId: number;
  questId: number;
  score: number | null;
  status: string;
  startDate: string;
  endDate: string | null;
  metadata: Record<string, unknown>;
  givenGems: number;
  givenEcopoints: number;

  constructor(attempt: {
    id: number;
    userId: number;
    questId: number;
    score: number | null;
    status: string;
    startDate: string;
    endDate: string | null;
    metadata: Record<string, unknown>;
    givenGems: number;
    givenEcopoints: number;
  }) {
    this.id = attempt.id;
    this.userId = attempt.userId;
    this.questId = attempt.questId;
    this.score = attempt.score;
    this.status = attempt.status;
    this.startDate = attempt.startDate;
    this.endDate = attempt.endDate;
    this.metadata = attempt.metadata;
    this.givenGems = attempt.givenGems;
    this.givenEcopoints = attempt.givenEcopoints;
  }

  get user_id(): number {
    return this.userId;
  }

  get quest_id(): number {
    return this.questId;
  }

  get start_date(): string {
    return this.startDate;
  }

  get end_date(): string | null {
    return this.endDate;
  }
}
