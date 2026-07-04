import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface NotificationResponse extends BaseResponse {
  notifications: NotificationResource[];
}

export interface NotificationResource extends BaseResource {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  reference_type?: string | null;
  reference_id?: number | null;
  created_at: string;
  read_at?: string | null;
}

export interface UnreadNotificationCountResource {
  user_id: number;
  unread_count: number;
}
