import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Event } from '../domain/model/event.entity';
import { EventAssembler } from './event-assembler';
import { EventResource, EventResponse } from './event-response';
import { Observable } from 'rxjs';

export class EventsApiEndpoint extends BaseApiEndpoint<
  Event,
  EventResource,
  EventResponse,
  EventAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderEventEndpointPath}`,
      new EventAssembler(),
    );
  }
  deleteEvent(id: number, authorId: number): Observable<void> {
    return this.http.delete<void>(`${this.endpointUrl}/${id}`, {
      params: { author_id: authorId },
    });
  }
}
