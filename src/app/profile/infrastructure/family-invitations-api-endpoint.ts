import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { FamilyInvitation } from '../domain/model/family-invitation.entity';
import { FamilyInvitationAssembler } from './family-invitation-assembler';
import {
  FamilyInvitationResource,
  FamilyInvitationResponse,
} from './family-invitation-response';

export class FamilyInvitationsApiEndpoint extends BaseApiEndpoint<
  FamilyInvitation,
  FamilyInvitationResource,
  FamilyInvitationResponse,
  FamilyInvitationAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderFamilyInvitationEndpointPath}`,
      new FamilyInvitationAssembler(),
    );
  }
}
