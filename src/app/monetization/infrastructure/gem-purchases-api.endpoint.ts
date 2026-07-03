import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';

import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';

import { GemPurchaseEntity } from '../domain/gem.purchase.entity';

import { GemPurchasesResponse } from './gem-purchase-response';

import { GemPurchaseAssembler } from './gem-purchase.assembler';

@Injectable({
  providedIn: 'root',
})
export class GemPurchasesApiEndpoint extends BaseApiEndpoint<
  GemPurchaseEntity,
  any,
  GemPurchasesResponse,
  GemPurchaseAssembler
> {
  constructor() {
    super(
      inject(HttpClient),
      `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderGemPurchaseEndpointPath}`,
      new GemPurchaseAssembler(),
    );
  }
}
