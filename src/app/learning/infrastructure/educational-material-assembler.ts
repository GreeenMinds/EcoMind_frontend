import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { EducationalMaterial } from '../domain/model/educational-material.entity';
import { EducationalMaterialResponse, EducationalMaterialResource } from './educational-material-response';

export class EducationalMaterialAssembler implements BaseAssembler<EducationalMaterial, EducationalMaterialResource, EducationalMaterialResponse> {
  toEntitiesFromResponse(response: EducationalMaterialResponse): EducationalMaterial[] {
    return response.educationalMaterials.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: EducationalMaterialResource): EducationalMaterial {
    return new EducationalMaterial({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      content: resource.content,
      materialType: resource.materialType,
      category: resource.category,
      imageUrl: resource.imageUrl,
      videoUrl: resource.videoUrl,
      durationMinutes: resource.durationMinutes,
    });
  }

  toResourceFromEntity(entity: EducationalMaterial): EducationalMaterialResource {
    return {
      id: entity.id,
      title: entity.title,
      description: entity.description,
      content: entity.content,
      materialType: entity.materialType,
      category: entity.category,
      imageUrl: entity.imageUrl,
      videoUrl: entity.videoUrl,
      durationMinutes: entity.durationMinutes,
    };
  }
}
