import {BaseApiEndpoint} from '../../shared/infrastructure/base-api-endpoint';
import {Quest} from '../domain/model/quest.entity';
import {QuestResponse, QuestResource} from './quest-response';
import {QuestAssembler} from './quest-assembler';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { QuestSearchFilters } from './quest-search-filters';

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
      `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderQuestEndpointPath}`,
      new QuestAssembler(),
    );
  }

  search(filters: QuestSearchFilters): Observable<Quest[]> {
    let params = new HttpParams();

    if (filters.title) {
      params = params.set('title', filters.title);
    }
    if (filters.category) {
      params = params.set('category', filters.category);
    }
    if (filters.questType) {
      params = params.set('questType', filters.questType);
    }
    if (filters.age !== null && filters.age !== undefined) {
      params = params.set('age', filters.age);
    }
    if (filters.type) {
      params = params.set('type', filters.type);
    }

    return this.http.get<QuestResponse | QuestResource[]>(`${this.endpointUrl}/search`, { params }).pipe(
      map((response) => {
        if (Array.isArray(response)) {
          return response.map((resource) => this.assembler.toEntityFromResource(resource));
        }
        return this.assembler.toEntitiesFromResponse(response);
      }),
      catchError(this.handleError('Failed to search quests')),
    );
  }
}
