import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
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
      `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderPostReactionEndpointPath}`,
      new CommunityPostReactionAssembler(),
    );
  }

  updateReactionType(reaction: CommunityPostReaction): Observable<CommunityPostReaction> {
    return this.http
      .patch<CommunityPostReactionResource>(`${this.endpointUrl}/${reaction.id}/type`, {
        reaction_type: reaction.reaction_type,
      })
      .pipe(map((updated) => this.assembler.toEntityFromResource(updated)));
  }
}
