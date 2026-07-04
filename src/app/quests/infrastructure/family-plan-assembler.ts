import { FamilyPlan, FamilyPlanItem } from '../domain/model/family-plan.entity';
import { FamilyPlanResource } from './family-plan-response';

export class FamilyPlanAssembler {
  toEntityFromResource(resource: FamilyPlanResource): FamilyPlan {
    return new FamilyPlan({
      id: resource.id,
      familyId: resource.familyId,
      ownerUserId: resource.ownerUserId,
      status: resource.status,
      progress: resource.progress ?? 0,
      items: (resource.items ?? []).map(
        (item) =>
          new FamilyPlanItem({
            id: item.id,
            questId: item.questId,
            collaborativeSessionId: item.collaborativeSessionId,
            progress: item.progress ?? 0,
          }),
      ),
    });
  }
}
