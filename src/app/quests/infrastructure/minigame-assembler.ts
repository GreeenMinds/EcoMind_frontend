import {BaseAssembler} from '../../shared/infrastructure/base-assembler';
import {Minigame} from '../domain/model/minigame.entity';
import {MinigameResponse, MinigameResource} from './minigame-response';

export class MinigameAssembler implements BaseAssembler<Minigame, MinigameResource, MinigameResponse> {
  toEntitiesFromResponse(response: MinigameResponse): Minigame[] {
    return response.minigames.map((resource) => this.toEntityFromResource(resource as MinigameResource));
  }

  toEntityFromResource(resource: MinigameResource): Minigame {
    return new Minigame({
      id: resource.id,
      name: resource.name,
      description: resource.description,
      url: resource.url,
    });
  }

  toResourceFromEntity(entity: Minigame): MinigameResource {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      url: entity.url,
    } as MinigameResource;
  }
}
