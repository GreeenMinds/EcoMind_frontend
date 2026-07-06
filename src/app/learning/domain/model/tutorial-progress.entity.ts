import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export class TutorialProgress implements BaseEntity {
  id: number;
  userId: number;
  currentStep: number;
  totalSteps: number;
  completed: boolean;
  skipped: boolean;
  completedAt: string | null;

  constructor(data: {
    id: number;
    userId: number;
    currentStep: number;
    totalSteps: number;
    completed: boolean;
    skipped: boolean;
    completedAt: string | null;
  }) {
    this.id = data.id;
    this.userId = data.userId;
    this.currentStep = data.currentStep;
    this.totalSteps = data.totalSteps;
    this.completed = data.completed;
    this.skipped = data.skipped;
    this.completedAt = data.completedAt;
  }
}
