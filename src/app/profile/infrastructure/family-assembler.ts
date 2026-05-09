import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Family } from '../domain/model/family.entity';
import { FamilyResource, FamilyResponse } from './family-response';

export class FamilyAssembler implements BaseAssembler<Family, FamilyResource, FamilyResponse> {
  toEntitiesFromResponse(response: FamilyResponse): Family[] {
    return response.families.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: FamilyResource): Family {
    const family = new Family();
    family.id = resource.id;
    family.name = resource.name;
    return family;
  }

  toResourceFromEntity(entity: Family): FamilyResource {
    return {
      id: entity.id,
      name: entity.name,
    };
  }
}
