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
    goal.goal_id = resource.goal_id;
    goal.description = resource.description;
    goal.target = resource.target;
    goal.progress = resource.progress;
    goal.participants = resource.participants;
    goal.status = resource.progress >= resource.target ? 'completed' : resource.status;
    return goal;
  }

  toResourceFromEntity(entity: CommunityGoal): CommunityGoalResource {
    return {
      id: entity.id,
      community_id: entity.community_id,
      goal_id: entity.goal_id,
      description: entity.description,
      target: entity.target,
      progress: entity.progress,
      participants: entity.participants,
      status: entity.progress >= entity.target ? 'completed' : entity.status,
    };
  }
}
