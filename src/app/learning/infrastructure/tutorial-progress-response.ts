import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export type TutorialProgressResponse = BaseResponse & {
  tutorialProgress: TutorialProgressResource[];
};

export type TutorialProgressResource = BaseResource & {
  id: number;
  userId: number;
  currentStep: number;
  totalSteps: number;
  completed: boolean;
  skipped: boolean;
  completedAt: string | null;
};
