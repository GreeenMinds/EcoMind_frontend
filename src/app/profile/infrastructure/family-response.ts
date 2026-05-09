import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface FamilyResponse extends BaseResponse {
  families: FamilyResource[];
}

export interface FamilyResource extends BaseResource {
  id: number;
  name: string;
}
