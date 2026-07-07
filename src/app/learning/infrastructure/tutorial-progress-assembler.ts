import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { TutorialProgress } from '../domain/model/tutorial-progress.entity';
import { TutorialProgressResponse, TutorialProgressResource } from './tutorial-progress-response';

export class TutorialProgressAssembler implements BaseAssembler<TutorialProgress, TutorialProgressResource, TutorialProgressResponse> {
  toEntitiesFromResponse(response: TutorialProgressResponse): TutorialProgress[] {
    return response.tutorialProgress.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: TutorialProgressResource): TutorialProgress {
    return new TutorialProgress({
      id: resource.id,
      userId: resource.userId,
      currentStep: resource.currentStep,
      totalSteps: resource.totalSteps,
      completed: resource.completed,
      skipped: resource.skipped,
      completedAt: resource.completedAt,
    });
  }

  toResourceFromEntity(entity: TutorialProgress): TutorialProgressResource {
    return {
      id: entity.id,
      userId: entity.userId,
      currentStep: entity.currentStep,
      totalSteps: entity.totalSteps,
      completed: entity.completed,
      skipped: entity.skipped,
      completedAt: entity.completedAt,
    };
  }
}
