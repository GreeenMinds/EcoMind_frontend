import { BaseResource } from '../../shared/infrastructure/base-response';
import { FamilyPlanStatus } from '../domain/model/family-plan.entity';

export type FamilyPlanItemResource = BaseResource & {
  id: number;
  questId: number;
  collaborativeSessionId: number | null;
  progress: number;
};

export type FamilyPlanResource = BaseResource & {
  id: number;
  familyId: number;
  ownerUserId: number;
  status: FamilyPlanStatus;
  progress: number;
  items: FamilyPlanItemResource[];
};

export type FamilyPlanItemPayload = {
  questId: number;
};

export type CreateFamilyPlanPayload = {
  familyId: number;
  ownerUserId: number;
  items: FamilyPlanItemPayload[];
};

export type UpdateFamilyPlanPayload = {
  items: FamilyPlanItemPayload[];
};
