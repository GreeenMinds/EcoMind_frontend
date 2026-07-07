import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { CommunityPost } from '../domain/model/community-post.entity';
import { CommunityPostAssembler } from './community-post-assembler';
import { CommunityPostResource, CommunityPostResponse } from './community-post-response';

export class CommunityPostsApiEndpoint extends BaseApiEndpoint<
  CommunityPost,
  CommunityPostResource,
  CommunityPostResponse,
  CommunityPostAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderCommunityPostEndpointPath}`,
      new CommunityPostAssembler(),
    );
  }
}
