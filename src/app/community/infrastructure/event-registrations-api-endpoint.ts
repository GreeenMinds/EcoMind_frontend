import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
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
      `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderEventEndpointPath}`,
      new EventRegistrationAssembler(),
    );
  }

  getByEvent(eventId: number): Observable<EventRegistration[]> {
    return this.http
      .get<EventRegistrationResource[]>(`${this.endpointUrl}/${eventId}/registrations`)
      .pipe(
        map((registrations) =>
          registrations.map((registration) => this.assembler.toEntityFromResource(registration)),
        ),
      );
  }

  createForEvent(eventId: number, registration: EventRegistration): Observable<EventRegistration> {
    const resource = this.assembler.toResourceFromEntity(registration);
    return this.http
      .post<EventRegistrationResource>(`${this.endpointUrl}/${eventId}/registrations`, resource)
      .pipe(map((created) => this.assembler.toEntityFromResource(created)));
  }

  cancel(eventId: number, registrationId: number): Observable<EventRegistration> {
    return this.http
      .patch<EventRegistrationResource>(
        `${this.endpointUrl}/${eventId}/registrations/${registrationId}/cancel`,
        {},
      )
      .pipe(map((updated) => this.assembler.toEntityFromResource(updated)));
  }
}
