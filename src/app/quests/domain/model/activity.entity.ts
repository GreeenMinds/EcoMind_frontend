import {BaseEntity} from '../../../shared/infrastructure/base-entity';

export class Activity implements BaseEntity {
  private _id: number;
  private _quest_id: number;
  private _description: string;
  private _order: number;
  private _type: string;
  private _image_url: string | null;

  constructor(activity: {
    id: number;
    quest_id: number;
    description: string;
    order: number;
    type: string;
    image_url: string | null;
  }) {
    this._id = activity.id;
    this._quest_id = activity.quest_id;
    this._description = activity.description;
    this._order = activity.order;
    this._type = activity.type;
    this._image_url = activity.image_url;
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

  get description(): string {
    return this._description;
  }

  set description(value: string) {
    this._description = value;
  }

  get order(): number {
    return this._order;
  }

  set order(value: number) {
    this._order = value;
  }

  get type(): string {
    return this._type;
  }

  set type(value: string) {
    this._type = value;
  }

  get image_url(): string | null {
    return this._image_url;
  }

  set image_url(value: string | null) {
    this._image_url = value;
  }
}
