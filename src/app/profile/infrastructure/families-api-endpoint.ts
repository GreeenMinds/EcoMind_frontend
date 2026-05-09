import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Family } from '../domain/model/family.entity';
import { FamilyAssembler } from './family-assembler';
import { FamilyResource, FamilyResponse } from './family-response';

export class FamiliesApiEndpoint extends BaseApiEndpoint<
  Family,
  FamilyResource,
  FamilyResponse,
  FamilyAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderFamilyEndpointPath}`,
      new FamilyAssembler(),
    );
  }
}
