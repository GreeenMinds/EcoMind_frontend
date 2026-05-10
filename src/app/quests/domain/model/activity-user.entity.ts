import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export class ActivityUser implements BaseEntity {
  private _id: number;
  private _user_id: number;
  private _activity_id: number;
  private _progress: number;
  private _end_date: string | null;
  private _collaborative_session_id: number | null;

  constructor(activityUser: {
    id: number;
    user_id: number;
    activity_id: number;
    progress: number;
    end_date: string | null;
    collaborative_session_id?: number | null;
  }) {
    this._id = activityUser.id;
    this._user_id = activityUser.user_id;
    this._activity_id = activityUser.activity_id;
    this._progress = activityUser.progress;
    this._end_date = activityUser.end_date;
    this._collaborative_session_id = activityUser.collaborative_session_id ?? null;
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

  get activity_id(): number {
    return this._activity_id;
  }

  set activity_id(value: number) {
    this._activity_id = value;
  }

  get progress(): number {
    return this._progress;
  }

  set progress(value: number) {
    this._progress = value;
  }

  get end_date(): string | null {
    return this._end_date;
  }

  set end_date(value: string | null) {
    this._end_date = value;
  }

  get collaborative_session_id(): number | null {
    return this._collaborative_session_id;
  }

  set collaborative_session_id(value: number | null) {
    this._collaborative_session_id = value;
  }
}
