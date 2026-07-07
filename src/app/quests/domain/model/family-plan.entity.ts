import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export type FamilyPlanStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export class FamilyPlanItem implements BaseEntity {
  id: number;
  questId: number;
  collaborativeSessionId: number | null;
  progress: number;

  constructor(item: {
    id: number;
    questId: number;
    collaborativeSessionId: number | null;
    progress: number;
  }) {
    this.id = item.id;
    this.questId = item.questId;
    this.collaborativeSessionId = item.collaborativeSessionId;
    this.progress = item.progress;
  }
}

export class FamilyPlan implements BaseEntity {
  id: number;
  familyId: number;
  ownerUserId: number;
  status: FamilyPlanStatus;
  progress: number;
  items: FamilyPlanItem[];

  constructor(plan: {
    id: number;
    familyId: number;
    ownerUserId: number;
    status: FamilyPlanStatus;
    progress: number;
    items: FamilyPlanItem[];
  }) {
    this.id = plan.id;
    this.familyId = plan.familyId;
    this.ownerUserId = plan.ownerUserId;
    this.status = plan.status;
    this.progress = plan.progress;
    this.items = plan.items;
  }
}
