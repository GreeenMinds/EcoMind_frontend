import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';

import { UserCosmeticEntity } from '../domain/user-cosmetic.entity';

import { UserCosmeticsResponse } from './user-cosmetics-response';

import { UserCosmeticAssembler } from './user-cosmetic.assembler';

@Injectable({
  providedIn: 'root',
})
export class UserCosmeticsApiEndpoint extends BaseApiEndpoint<
  UserCosmeticEntity,
  any,
  UserCosmeticsResponse,
  UserCosmeticAssembler
> {
  constructor() {
    super(
      inject(HttpClient),
      `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderUserCosmeticEndpointPath}`,
      new UserCosmeticAssembler(),
    );
  }

  getByUser(userId: number): Observable<UserCosmeticEntity[]> {
    return this.http
      .get<any[]>(`${this.endpointUrl}/user/${userId}`)
      .pipe(map((items) => items.map((item) => this.assembler.toEntityFromResource(item))));
  }
}
