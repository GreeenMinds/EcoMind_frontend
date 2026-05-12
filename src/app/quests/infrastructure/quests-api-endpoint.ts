import {BaseApiEndpoint} from '../../shared/infrastructure/base-api-endpoint';
import {Quest} from '../domain/model/quest.entity';
import {QuestResponse, QuestResource} from './quest-response';
import {QuestAssembler} from './quest-assembler';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';

export class QuestsApiEndpoint extends BaseApiEndpoint<
  Quest,
  QuestResource,
  QuestResponse,
  QuestAssembler
> {
  /**
   * Creates an instance of QuestsApiEndpoint.
   * @param http - The HttpClient to be used for making API requests.
   */
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderQuestEndpointPath}`,
      new QuestAssembler(),
    );
  }
}
