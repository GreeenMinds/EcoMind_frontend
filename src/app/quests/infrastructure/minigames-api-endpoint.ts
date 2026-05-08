import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {BaseApiEndpoint} from '../../shared/infrastructure/base-api-endpoint';
import {Minigame} from '../domain/model/minigame.entity';
import {MinigameAssembler} from './minigame-assembler';
import {MinigameResponse, MinigameResource} from './minigame-response';

export class MinigamesApiEndpoint extends BaseApiEndpoint<
  Minigame,
  MinigameResource,
  MinigameResponse,
  MinigameAssembler
> {
  /**
   * Creates an instance of MinigamesApiEndpoint.
   * @param http - The HttpClient to be used for making API requests.
   */
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderMinigameEndpointPath}`,
      new MinigameAssembler(),
    );
  }
}
