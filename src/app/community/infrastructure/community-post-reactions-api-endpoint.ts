import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { CommunityPostReaction } from '../domain/model/community-post-reaction.entity';
import { CommunityPostReactionAssembler } from './community-post-reaction-assembler';
import {
  CommunityPostReactionResource,
  CommunityPostReactionResponse,
} from './community-post-reaction-response';

export class CommunityPostReactionsApiEndpoint extends BaseApiEndpoint<
  CommunityPostReaction,
  CommunityPostReactionResource,
  CommunityPostReactionResponse,
  CommunityPostReactionAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderPostReactionEndpointPath}`,
      new CommunityPostReactionAssembler(),
    );
  }
}
