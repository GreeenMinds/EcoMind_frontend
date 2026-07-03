import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';

import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';

import { MultiplierEntity } from '../domain/multiplier.entity';

import { MultipliersResponse } from './multipliers-response';
import { MultiplierAssembler } from './multiplier.assembler';

@Injectable({
  providedIn: 'root',
})
export class MultipliersApiEndpoint extends BaseApiEndpoint<
  MultiplierEntity,
  any,
  MultipliersResponse,
  MultiplierAssembler
> {

  constructor() {
    super(
      inject(HttpClient),
      `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderMultiplierEndpointPath}`,
      new MultiplierAssembler(),
    );
  }
}
