import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { CollaborativeQuestMember } from '../domain/model/collaborative-quest-member.entity';
import { CollaborativeQuestMemberAssembler } from './collaborative-quest-member-assembler';
import {
  CollaborativeQuestMemberResource,
  CollaborativeQuestMemberResponse,
} from './collaborative-quest-member-response';

export class CollaborativeQuestMembersApiEndpoint extends BaseApiEndpoint<
  CollaborativeQuestMember,
  CollaborativeQuestMemberResource,
  CollaborativeQuestMemberResponse,
  CollaborativeQuestMemberAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderCollaborativeQuestMemberEndpointPath}`,
      new CollaborativeQuestMemberAssembler(),
    );
  }
}
