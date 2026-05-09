import {BaseEntity} from '../../../shared/infrastructure/base-entity';

export class Minigame implements BaseEntity {
  private _id: number;
  private _name: string;
  private _description: string;
  private _url: string;

  constructor(minigame: {
    id: number;
    name: string;
    description: string;
    url: string;
  }) {
    this._id = minigame.id;
    this._name = minigame.name;
    this._description = minigame.description;
    this._url = minigame.url;
  }

  get id(): number {
    return this._id;
  }

  set id(value: number) {
    this._id = value;
  }

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  get description(): string {
    return this._description;
  }

  set description(value: string) {
    this._description = value;
  }

  get url(): string {
    return this._url;
  }

  set url(value: string) {
    this._url = value;
  }
}
