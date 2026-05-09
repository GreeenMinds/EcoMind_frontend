import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {BaseApiEndpoint} from '../../shared/infrastructure/base-api-endpoint';
import {MinigameAttempt} from '../domain/model/minigame-attempt.entity';
import {MinigameAttemptAssembler} from './minigame-attempt-assembler';
import {MinigameAttemptResponse, MinigameAttemptResource} from './minigame-attempt-response';

export class MinigameAttemptsApiEndpoint extends BaseApiEndpoint<
  MinigameAttempt,
  MinigameAttemptResource,
  MinigameAttemptResponse,
  MinigameAttemptAssembler
> {
  /**
   * Creates an instance of MinigameAttemptsApiEndpoint.
   * @param http - The HttpClient to be used for making API requests.
   */
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderMinigameAttemptEndpointPath}`,
      new MinigameAttemptAssembler(),
    );
  }
}
