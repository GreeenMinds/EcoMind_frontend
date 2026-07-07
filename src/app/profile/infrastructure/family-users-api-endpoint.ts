import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { FamilyUser } from '../domain/model/family-user.entity';
import { FamilyUserAssembler } from './family-user-assembler';
import { FamilyUserResource, FamilyUserResponse } from './family-user-response';

export class FamilyUsersApiEndpoint extends BaseApiEndpoint<
  FamilyUser,
  FamilyUserResource,
  FamilyUserResponse,
  FamilyUserAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderFamilyUserEndpointPath}`,
      new FamilyUserAssembler(),
    );
  }
}
