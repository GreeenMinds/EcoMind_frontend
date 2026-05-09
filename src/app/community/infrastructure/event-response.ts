import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface EventResponse extends BaseResponse {
  events: EventResource[];
}

export interface EventResource extends BaseResource {
  id: number;
  community_id: number;
  author_id: number;
  name: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  latitude: number;
  longitude: number;
  capacity: number;
  image_url: string | null;
}
