import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { CosmeticEntity } from '../domain/cosmetic.entity';
import { CosmeticsResponse } from './cosmetics-response';
import { CosmeticAssembler } from './cosmetic.assembler';

@Injectable({
  providedIn: 'root',
})
export class CosmeticsApiEndpoint extends BaseApiEndpoint<
  CosmeticEntity,
  any,
  CosmeticsResponse,
  CosmeticAssembler
> {

  constructor() {
    super(
      inject(HttpClient),
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderCosmeticEndpointPath}`,
      new CosmeticAssembler(),
    );
  }
}
