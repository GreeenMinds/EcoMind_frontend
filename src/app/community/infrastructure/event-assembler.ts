import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Event } from '../domain/model/event.entity';
import { EventResource, EventResponse } from './event-response';

export class EventAssembler implements BaseAssembler<Event, EventResource, EventResponse> {
  toEntitiesFromResponse(response: EventResponse): Event[] {
    return response.events.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: EventResource): Event {
    const event = new Event();
    event.id = resource.id;
    event.community_id = resource.community_id;
    event.author_id = resource.author_id;
    event.name = resource.name;
    event.description = resource.description;
    event.date = resource.date;
    event.start_time = resource.start_time;
    event.end_time = resource.end_time;
    event.location = resource.location;
    event.latitude = resource.latitude;
    event.longitude = resource.longitude;
    event.capacity = resource.capacity;
    event.image_url = resource.image_url;
    return event;
  }

  toResourceFromEntity(entity: Event): EventResource {
    return {
      id: entity.id,
      community_id: entity.community_id,
      author_id: entity.author_id,
      name: entity.name,
      description: entity.description,
      date: entity.date,
      start_time: entity.start_time,
      end_time: entity.end_time,
      location: entity.location,
      latitude: entity.latitude,
      longitude: entity.longitude,
      capacity: entity.capacity,
      image_url: entity.image_url,
    };
  }
}
