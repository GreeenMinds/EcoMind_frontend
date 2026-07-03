import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export class Minigame implements BaseEntity {
  id: number;
  name: string;
  description: string;
  url: string;
  completionRules: Record<string, unknown>;

  constructor(minigame: {
    id: number;
    name: string;
    description: string;
    url: string;
    completionRules: Record<string, unknown>;
  }) {
    this.id = minigame.id;
    this.name = minigame.name;
    this.description = minigame.description;
    this.url = minigame.url;
    this.completionRules = minigame.completionRules;
  }
}
