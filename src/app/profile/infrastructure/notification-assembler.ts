import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Notification } from '../domain/model/notification.entity';
import { NotificationResource, NotificationResponse } from './notification-response';

export class NotificationAssembler
  implements BaseAssembler<Notification, NotificationResource, NotificationResponse>
{
  toEntitiesFromResponse(response: NotificationResponse): Notification[] {
    return response.notifications.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: NotificationResource): Notification {
    const notification = new Notification();
    notification.id = resource.id;
    notification.user_id = resource.user_id;
    notification.type = resource.type;
    notification.title = resource.title;
    notification.message = resource.message;
    notification.is_read = resource.is_read;
    notification.reference_type = resource.reference_type ?? null;
    notification.reference_id = resource.reference_id ?? null;
    notification.created_at = resource.created_at;
    notification.read_at = resource.read_at ?? null;
    return notification;
  }

  toResourceFromEntity(entity: Notification): NotificationResource {
    return {
      id: entity.id,
      user_id: entity.user_id,
      type: entity.type,
      title: entity.title,
      message: entity.message,
      is_read: entity.is_read,
      reference_type: entity.reference_type,
      reference_id: entity.reference_id,
      created_at: entity.created_at,
      read_at: entity.read_at,
    };
  }
}
