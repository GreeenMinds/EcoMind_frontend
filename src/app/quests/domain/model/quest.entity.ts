import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export class Quest implements BaseEntity {
  private _id: number;
  private _minigame_id: number | null;
  private _category: string;
  private _title: string;
  private _description: string;
  private _image_url: string | null;
  private _age: number;
  private _type: string;
  private _reward_gems: number;
  private _reward_ecopoints: number;
  private _expiration_date: string | null;
  private _time: number;
  private _theme_type: string;
  private _status: string;
  private _progress: number;
  private _started: boolean;
  private _completed: boolean;
  private _has_completed_attempt: boolean;
  private _activities_count: number;
  private _completed_activities_count: number;

  constructor(quest: {
    id: number;
    minigame_id: number | null;
    category: string;
    title: string;
    description: string;
    image_url: string | null;
    age: number;
    type: string;
    reward_gems: number;
    reward_ecopoints: number;
    expiration_date: string | null;
    time: number;
    theme_type?: string;
    status?: string;
    progress?: number;
    started?: boolean;
    completed?: boolean;
    has_completed_attempt?: boolean;
    activities_count?: number;
    completed_activities_count?: number;
  }) {
    this._id = quest.id;
    this._minigame_id = quest.minigame_id;
    this._category = quest.category;
    this._title = quest.title;
    this._description = quest.description;
    this._image_url = quest.image_url;
    this._age = quest.age;
    this._type = quest.type;
    this._reward_gems = quest.reward_gems;
    this._reward_ecopoints = quest.reward_ecopoints;
    this._expiration_date = quest.expiration_date;
    this._time = quest.time;
    this._theme_type = quest.theme_type ?? quest.type;
    this._status = quest.status ?? 'pending';
    this._progress = quest.progress ?? 0;
    this._started = quest.started ?? false;
    this._completed = quest.completed ?? false;
    this._has_completed_attempt = quest.has_completed_attempt ?? false;
    this._activities_count = quest.activities_count ?? 0;
    this._completed_activities_count = quest.completed_activities_count ?? 0;
  }

  get id(): number {
    return this._id;
  }

  set id(value: number) {
    this._id = value;
  }

  get minigame_id(): number | null {
    return this._minigame_id;
  }

  set minigame_id(value: number | null) {
    this._minigame_id = value;
  }

  get category(): string {
    return this._category;
  }

  set category(value: string) {
    this._category = value;
  }

  get title(): string {
    return this._title;
  }

  set title(value: string) {
    this._title = value;
  }

  get description(): string {
    return this._description;
  }

  set description(value: string) {
    this._description = value;
  }

  get image_url(): string | null {
    return this._image_url;
  }

  set image_url(value: string | null) {
    this._image_url = value;
  }

  get age(): number {
    return this._age;
  }

  set age(value: number) {
    this._age = value;
  }

  get type(): string {
    return this._type;
  }

  set type(value: string) {
    this._type = value;
  }

  get reward_gems(): number {
    return this._reward_gems;
  }

  set reward_gems(value: number) {
    this._reward_gems = value;
  }

  get reward_ecopoints(): number {
    return this._reward_ecopoints;
  }

  set reward_ecopoints(value: number) {
    this._reward_ecopoints = value;
  }

  get expiration_date(): string | null {
    return this._expiration_date;
  }

  set expiration_date(value: string | null) {
    this._expiration_date = value;
  }

  get time(): number {
    return this._time;
  }

  set time(value: number) {
    this._time = value;
  }

  get theme_type(): string {
    return this._theme_type;
  }

  set theme_type(value: string) {
    this._theme_type = value;
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

  get started(): boolean {
    return this._started;
  }

  set started(value: boolean) {
    this._started = value;
  }

  get completed(): boolean {
    return this._completed;
  }

  set completed(value: boolean) {
    this._completed = value;
  }

  get has_completed_attempt(): boolean {
    return this._has_completed_attempt;
  }

  set has_completed_attempt(value: boolean) {
    this._has_completed_attempt = value;
  }

  get activities_count(): number {
    return this._activities_count;
  }

  set activities_count(value: number) {
    this._activities_count = value;
  }

  get completed_activities_count(): number {
    return this._completed_activities_count;
  }

  set completed_activities_count(value: number) {
    this._completed_activities_count = value;
  }
}
