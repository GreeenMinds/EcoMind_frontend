import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { User } from '../domain/model/user.entity';
import { UserAssembler } from './user-assembler';
import { UserResource, UserResponse } from './user-response';

export class UsersApiEndpoint extends BaseApiEndpoint<
  User,
  UserResource,
  UserResponse,
  UserAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderUserEndpointPath}`,
      new UserAssembler(),
    );
  }
}
