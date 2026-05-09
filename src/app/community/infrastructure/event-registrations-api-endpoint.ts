import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { EventRegistration } from '../domain/model/event-registration.entity';
import { EventRegistrationAssembler } from './event-registration-assembler';
import {
  EventRegistrationResource,
  EventRegistrationResponse,
} from './event-registration-response';

export class EventRegistrationsApiEndpoint extends BaseApiEndpoint<
  EventRegistration,
  EventRegistrationResource,
  EventRegistrationResponse,
  EventRegistrationAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderEventRegistrationEndpointPath}`,
      new EventRegistrationAssembler(),
    );
  }
}
