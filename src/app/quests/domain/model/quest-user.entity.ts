import {BaseEntity} from '../../../shared/infrastructure/base-entity';

export class QuestUser implements BaseEntity {
  private _id: number;
  private _user_id: number;
  private _quest_id: number;
  private _status: string;
  private _progress: number;
  private _start_date: string;
  private _end_date: string | null;
  private _collaborative_session_id: number | null;

  constructor(questUser: {
    id: number;
    user_id: number;
    quest_id: number;
    status: string;
    progress: number;
    start_date: string;
    end_date: string | null;
    collaborative_session_id?: number | null;
  }) {
    this._id = questUser.id;
    this._user_id = questUser.user_id;
    this._quest_id = questUser.quest_id;
    this._status = questUser.status;
    this._progress = questUser.progress;
    this._start_date = questUser.start_date;
    this._end_date = questUser.end_date;
    this._collaborative_session_id = questUser.collaborative_session_id ?? null;
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

  get status(): string {
    return this._status;
  }

  set status(value: string) {
    this._status = value;
  }

  get progress(): number {
    return this._progress;
  }

  set progress(value: number) {
    this._progress = value;
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

  get collaborative_session_id(): number | null {
    return this._collaborative_session_id;
  }

  set collaborative_session_id(value: number | null) {
    this._collaborative_session_id = value;
  }
}
