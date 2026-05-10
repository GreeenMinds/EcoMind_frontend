import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export class CollaborativeQuestSession implements BaseEntity {
  private _id: number;
  private _quest_id: number;
  private _owner_user_id: number;
  private _status: string;
  private _created_at: string;
  private _started_at: string | null;
  private _completed_at: string | null;

  constructor(session: {
    id: number;
    quest_id: number;
    owner_user_id: number;
    status: string;
    created_at: string;
    started_at: string | null;
    completed_at: string | null;
  }) {
    this._id = session.id;
    this._quest_id = session.quest_id;
    this._owner_user_id = session.owner_user_id;
    this._status = session.status;
    this._created_at = session.created_at;
    this._started_at = session.started_at;
    this._completed_at = session.completed_at;
  }

  get id(): number {
    return this._id;
  }

  set id(value: number) {
    this._id = value;
  }

  get quest_id(): number {
    return this._quest_id;
  }

  set quest_id(value: number) {
    this._quest_id = value;
  }

  get owner_user_id(): number {
    return this._owner_user_id;
  }

  set owner_user_id(value: number) {
    this._owner_user_id = value;
  }

  get status(): string {
    return this._status;
  }

  set status(value: string) {
    this._status = value;
  }

  get created_at(): string {
    return this._created_at;
  }

  set created_at(value: string) {
    this._created_at = value;
  }

  get started_at(): string | null {
    return this._started_at;
  }

  set started_at(value: string | null) {
    this._started_at = value;
  }

  get completed_at(): string | null {
    return this._completed_at;
  }

  set completed_at(value: string | null) {
    this._completed_at = value;
  }
}
