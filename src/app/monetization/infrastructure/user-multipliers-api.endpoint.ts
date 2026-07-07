import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';

import { UserMultiplierEntity } from '../domain/user-multiplier.entity';

import { UserMultipliersResponse } from './user-multipliers-response';

import { UserMultiplierAssembler } from './user-multiplier.assembler';

@Injectable({
  providedIn: 'root',
})
export class UserMultipliersApiEndpoint extends BaseApiEndpoint<
  UserMultiplierEntity,
  any,
  UserMultipliersResponse,
  UserMultiplierAssembler
> {
  constructor() {
    super(
      inject(HttpClient),
      `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderUserMultiplierEndpointPath}`,
      new UserMultiplierAssembler(),
    );
  }

  getByUser(userId: number): Observable<UserMultiplierEntity[]> {
    return this.http
      .get<any[]>(`${this.endpointUrl}/user/${userId}`)
      .pipe(map((items) => items.map((item) => this.assembler.toEntityFromResource(item))));
  }
}
