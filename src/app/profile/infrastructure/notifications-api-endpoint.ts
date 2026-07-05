import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Notification } from '../domain/model/notification.entity';
import { NotificationAssembler } from './notification-assembler';
import {
  NotificationResource,
  NotificationResponse,
  UnreadNotificationCountResource,
} from './notification-response';

export class NotificationsApiEndpoint extends BaseApiEndpoint<
  Notification,
  NotificationResource,
  NotificationResponse,
  NotificationAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderNotificationEndpointPath}`,
      new NotificationAssembler(),
    );
  }

  getByUser(userId: number): Observable<Notification[]> {
    const params = new HttpParams().set('user_id', userId);
    return this.http.get<NotificationResource[]>(this.endpointUrl, { params }).pipe(
      map((response) => response.map((resource) => this.assembler.toEntityFromResource(resource))),
      catchError(this.handleError('Failed to fetch notifications')),
    );
  }

  getUnreadCount(userId: number): Observable<number> {
    const params = new HttpParams().set('user_id', userId);
    return this.http
      .get<UnreadNotificationCountResource>(`${this.endpointUrl}/unread-count`, { params })
      .pipe(
        map((response) => response.unread_count),
        catchError(this.handleError('Failed to fetch unread notifications')),
      );
  }

  markAsRead(notificationId: number): Observable<Notification> {
    return this.http
      .patch<NotificationResource>(`${this.endpointUrl}/${notificationId}/read`, {})
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError(this.handleError('Failed to mark notification as read')),
      );
  }

  markAllAsRead(userId: number): Observable<Notification[]> {
    const params = new HttpParams().set('user_id', userId);
    return this.http
      .patch<NotificationResource[]>(`${this.endpointUrl}/read-all`, {}, { params })
      .pipe(
        map((response) => response.map((resource) => this.assembler.toEntityFromResource(resource))),
        catchError(this.handleError('Failed to mark notifications as read')),
      );
  }
}
