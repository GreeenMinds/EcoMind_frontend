import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export type EducationalMaterialResponse = BaseResponse & {
  educationalMaterials: EducationalMaterialResource[];
};

export type EducationalMaterialResource = BaseResource & {
  id: number;
  title: string;
  description: string | null;
  content: string;
  materialType: string;
  category: string;
  imageUrl: string | null;
  videoUrl: string | null;
  durationMinutes: number | null;
  language?: string;
};
