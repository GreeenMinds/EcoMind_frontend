import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface EventRegistrationResponse extends BaseResponse {
  eventRegistrations: EventRegistrationResource[];
}

export interface EventRegistrationResource extends BaseResource {
  id: number;
  event_id: number;
  user_id: number;
  family_id: number | null;
  registration_type: string;
  registered_at: string;
  status: string;
}
