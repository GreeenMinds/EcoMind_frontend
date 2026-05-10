import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {BaseApiEndpoint} from '../../shared/infrastructure/base-api-endpoint';
import {CollaborativeQuestSession} from '../domain/model/collaborative-quest-session.entity';
import {CollaborativeQuestSessionAssembler} from './collaborative-quest-session-assembler';
import {
  CollaborativeQuestSessionResource,
  CollaborativeQuestSessionResponse,
} from './collaborative-quest-session-response';

export class CollaborativeQuestSessionsApiEndpoint extends BaseApiEndpoint<
  CollaborativeQuestSession,
  CollaborativeQuestSessionResource,
  CollaborativeQuestSessionResponse,
  CollaborativeQuestSessionAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderCollaborativeQuestSessionEndpointPath}`,
      new CollaborativeQuestSessionAssembler(),
    );
  }
}
