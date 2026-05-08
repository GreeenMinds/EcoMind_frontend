import {BaseEntity} from '../../../shared/infrastructure/base-entity';

export class MinigameAttempt implements BaseEntity {
  private _id: number;
  private _user_id: number;
  private _quest_id: number;
  private _score: number;
  private _status: string;
  private _start_date: string;
  private _end_date: string | null;
  private _metadata: Record<string, unknown>;

  constructor(minigameAttempt: {
    id: number;
    user_id: number;
    quest_id: number;
    score: number;
    status: string;
    start_date: string;
    end_date: string | null;
    metadata: Record<string, unknown>;
  }) {
    this._id = minigameAttempt.id;
    this._user_id = minigameAttempt.user_id;
    this._quest_id = minigameAttempt.quest_id;
    this._score = minigameAttempt.score;
    this._status = minigameAttempt.status;
    this._start_date = minigameAttempt.start_date;
    this._end_date = minigameAttempt.end_date;
    this._metadata = minigameAttempt.metadata;
  }

  get id(): number {
    return this._id;
  }

  set id(value: number) {
    this._id = value;
  }

  get user_id(): number {
    return this._user_id;
  }

  set user_id(value: number) {
    this._user_id = value;
  }

  get quest_id(): number {
    return this._quest_id;
  }

  set quest_id(value: number) {
    this._quest_id = value;
  }

  get score(): number {
    return this._score;
  }

  set score(value: number) {
    this._score = value;
  }

  get status(): string {
    return this._status;
  }

  set status(value: string) {
    this._status = value;
  }

  get start_date(): string {
    return this._start_date;
  }

  set start_date(value: string) {
    this._start_date = value;
  }

  get end_date(): string | null {
    return this._end_date;
  }

  set end_date(value: string | null) {
    this._end_date = value;
  }

  get metadata(): Record<string, unknown> {
    return this._metadata;
  }

  set metadata(value: Record<string, unknown>) {
    this._metadata = value;
  }
}
