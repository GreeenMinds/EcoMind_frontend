import {BaseEntity} from '../../../shared/infrastructure/base-entity';

export class CollaborativeQuestMember implements BaseEntity {
  private _id: number;
  private _session_id: number;
  private _user_id: number;
  private _invited_by_user_id: number | null;
  private _role: string;
  private _status: string;
  private _invited_at: string | null;
  private _responded_at: string | null;
  private _left_at: string | null;
  private _removed_at: string | null;

  constructor(member: {
    id: number;
    session_id: number;
    user_id: number;
    invited_by_user_id: number | null;
    role: string;
    status: string;
    invited_at: string | null;
    responded_at: string | null;
    left_at: string | null;
    removed_at: string | null;
  }) {
    this._id = member.id;
    this._session_id = member.session_id;
    this._user_id = member.user_id;
    this._invited_by_user_id = member.invited_by_user_id;
    this._role = member.role;
    this._status = member.status;
    this._invited_at = member.invited_at;
    this._responded_at = member.responded_at;
    this._left_at = member.left_at;
    this._removed_at = member.removed_at;
  }

  get id(): number {
    return this._id;
  }

  set id(value: number) {
    this._id = value;
  }

  get session_id(): number {
    return this._session_id;
  }

  set session_id(value: number) {
    this._session_id = value;
  }

  get user_id(): number {
    return this._user_id;
  }

  set user_id(value: number) {
    this._user_id = value;
  }

  get invited_by_user_id(): number | null {
    return this._invited_by_user_id;
  }

  set invited_by_user_id(value: number | null) {
    this._invited_by_user_id = value;
  }

  get role(): string {
    return this._role;
  }

  set role(value: string) {
    this._role = value;
  }

  get status(): string {
    return this._status;
  }

  set status(value: string) {
    this._status = value;
  }

  get invited_at(): string | null {
    return this._invited_at;
  }

  set invited_at(value: string | null) {
    this._invited_at = value;
  }

  get responded_at(): string | null {
    return this._responded_at;
  }

  set responded_at(value: string | null) {
    this._responded_at = value;
  }

  get left_at(): string | null {
    return this._left_at;
  }

  set left_at(value: string | null) {
    this._left_at = value;
  }

  get removed_at(): string | null {
    return this._removed_at;
  }

  set removed_at(value: string | null) {
    this._removed_at = value;
  }
}
