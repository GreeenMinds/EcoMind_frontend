import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { CommunityGoal } from '../domain/model/community-goal.entity';
import { CommunityGoalResource, CommunityGoalResponse } from './community-goal-response';

export class CommunityGoalAssembler implements BaseAssembler<
  CommunityGoal,
  CommunityGoalResource,
  CommunityGoalResponse
> {
  toEntitiesFromResponse(response: CommunityGoalResponse): CommunityGoal[] {
    return response.communityGoals.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: CommunityGoalResource): CommunityGoal {
    const goal = new CommunityGoal();
    goal.id = resource.id;
    goal.community_id = resource.community_id;
    goal.title = resource.title;
    goal.target = resource.target;
    goal.progress = resource.progress;
    goal.unit = resource.unit;
    goal.participants = resource.participants;
    goal.status = resource.status;
    return goal;
  }

  toResourceFromEntity(entity: CommunityGoal): CommunityGoalResource {
    return {
      id: entity.id,
      community_id: entity.community_id,
      title: entity.title,
      target: entity.target,
      progress: entity.progress,
      unit: entity.unit,
      participants: entity.participants,
      status: entity.status,
    };
  }
}
