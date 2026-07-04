import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Goal } from '../domain/model/goal.entity';
import { GoalResource, GoalResponse } from './goal-response';

export class GoalAssembler implements BaseAssembler<Goal, GoalResource, GoalResponse> {
  toEntitiesFromResponse(response: GoalResponse): Goal[] {
    return response.goals.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: GoalResource): Goal {
    const goal = new Goal();
    goal.id = resource.id;
    goal.title = resource.title;
    goal.unit = resource.unit;
    return goal;
  }

  toResourceFromEntity(entity: Goal): GoalResource {
    return {
      id: entity.id,
      title: entity.title,
      unit: entity.unit,
    };
  }
}
