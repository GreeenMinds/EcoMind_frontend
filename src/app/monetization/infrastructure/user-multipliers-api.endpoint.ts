import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';

import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';

import { UserMultiplierEntity } from '../domain/user-multiplier.entity';

import { UserMultipliersResponse } from './user-multipliers-response';

import { UserMultiplierAssembler } from './user-multiplier.assembler';

@Injectable({
  providedIn: 'root',
})
export class UserMultipliersApiEndpoint extends BaseApiEndpoint<
  UserMultiplierEntity,
  any,
  UserMultipliersResponse,
  UserMultiplierAssembler
> {
  constructor() {
    super(
      inject(HttpClient),
      `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderUserMultiplierEndpointPath}`,
      new UserMultiplierAssembler(),
    );
  }
}
