import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {BaseApiEndpoint} from '../../shared/infrastructure/base-api-endpoint';
import {QuestUser} from '../domain/model/quest-user.entity';
import {QuestUserAssembler} from './quest-user-assembler';
import {QuestUserResponse, QuestUserResource} from './quest-user-response';

export class QuestsUserApiEndpoint extends BaseApiEndpoint<
  QuestUser,
  QuestUserResource,
  QuestUserResponse,
  QuestUserAssembler
> {
  /**
   * Creates an instance of QuestsUserApiEndpoint.
   * @param http - The HttpClient to be used for making API requests.
   */
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderUserQuestEndpointPath}`,
      new QuestUserAssembler(),
    );
  }
}
