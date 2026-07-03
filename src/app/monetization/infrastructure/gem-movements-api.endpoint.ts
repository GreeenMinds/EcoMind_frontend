import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';

import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';

import { GemMovementEntity } from '../domain/gem.movement.entity';

import { GemMovementsResponse } from './gem-movements-response';
import { GemMovementAssembler } from './gem-movement.assembler';

@Injectable({
  providedIn: 'root',
})
export class GemMovementsApiEndpoint extends BaseApiEndpoint<
  GemMovementEntity,
  any,
  GemMovementsResponse,
  GemMovementAssembler
> {

  constructor() {
    super(
      inject(HttpClient),
      `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderGemMovementEndpointPath}`,
      new GemMovementAssembler(),
    );
  }
}
