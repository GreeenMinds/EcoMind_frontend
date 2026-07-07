import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { EventRegistration } from '../domain/model/event-registration.entity';
import { EventRegistrationResource, EventRegistrationResponse } from './event-registration-response';

export class EventRegistrationAssembler implements BaseAssembler<
  EventRegistration,
  EventRegistrationResource,
  EventRegistrationResponse
> {
  toEntitiesFromResponse(response: EventRegistrationResponse): EventRegistration[] {
    return response.eventRegistrations.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: EventRegistrationResource): EventRegistration {
    const registration = new EventRegistration();
    registration.id = resource.id;
    registration.event_id = resource.event_id;
    registration.user_id = resource.user_id;
    registration.family_id = resource.family_id;
    registration.registration_type = this.toFrontendRegistrationType(resource.registration_type);
    registration.registered_at = resource.registered_at;
    registration.status = this.toFrontendStatus(resource.status);
    return registration;
  }

  toResourceFromEntity(entity: EventRegistration): EventRegistrationResource {
    return {
      id: entity.id,
      event_id: entity.event_id,
      user_id: entity.user_id,
      family_id: entity.family_id,
      registration_type: this.toBackendRegistrationType(entity.registration_type),
      registered_at: entity.registered_at,
      status: this.toBackendStatus(entity.status),
    };
  }

  private toFrontendRegistrationType(value: string): string {
    return value.toLowerCase();
  }

  private toBackendRegistrationType(value: string): string {
    return value.toUpperCase();
  }

  private toFrontendStatus(value: string): string {
    return value === 'REGISTERED' ? 'active' : value.toLowerCase();
  }

  private toBackendStatus(value: string): string {
    return value === 'active' ? 'REGISTERED' : value.toUpperCase();
  }
}
