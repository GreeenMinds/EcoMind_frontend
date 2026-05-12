import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Community } from '../domain/model/community.entity';
import { CommunityAssembler } from './community-assembler';
import { CommunityResource, CommunityResponse } from './community-response';

export class CommunitiesApiEndpoint extends BaseApiEndpoint<
  Community,
  CommunityResource,
  CommunityResponse,
  CommunityAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderCommunityEndpointPath}`,
      new CommunityAssembler(),
    );
  }
}
