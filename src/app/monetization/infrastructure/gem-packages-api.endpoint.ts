import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';

import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';

import { GemPackageEntity } from '../domain/gem-package.entity';

import { GemPackagesResponse } from './gem-packages-response';
import { GemPackageAssembler } from './gem-package.assembler';

@Injectable({
  providedIn: 'root',
})
export class GemPackagesApiEndpoint extends BaseApiEndpoint<
  GemPackageEntity,
  any,
  GemPackagesResponse,
  GemPackageAssembler
> {

  constructor() {
    super(
      inject(HttpClient),
      `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderGemPackageEndpointPath}`,
      new GemPackageAssembler(),
    );
  }
}
