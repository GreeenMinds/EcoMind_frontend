import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { CommunityMember } from '../domain/model/community-member.entity';
import { CommunityMemberAssembler } from './community-member-assembler';
import { CommunityMemberResource, CommunityMemberResponse } from './community-member-response';

export class CommunityMembersApiEndpoint extends BaseApiEndpoint<
  CommunityMember,
  CommunityMemberResource,
  CommunityMemberResponse,
  CommunityMemberAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderUserEndpointPath}`,
      new CommunityMemberAssembler(),
    );
  }
}
