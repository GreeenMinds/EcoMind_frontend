import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Event } from '../domain/model/event.entity';
import { EventAssembler } from './event-assembler';
import { EventResource, EventResponse } from './event-response';

export class EventsApiEndpoint extends BaseApiEndpoint<
  Event,
  EventResource,
  EventResponse,
  EventAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderEventEndpointPath}`,
      new EventAssembler(),
    );
  }
}
