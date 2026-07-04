import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { FamilyPlan } from '../domain/model/family-plan.entity';
import { FamilyPlanAssembler } from './family-plan-assembler';
import {
  CreateFamilyPlanPayload,
  FamilyPlanResource,
  UpdateFamilyPlanPayload,
} from './family-plan-response';

export class FamilyPlansApiEndpoint {
  private readonly endpointUrl =
    `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderFamilyPlanEndpointPath}`;
  private readonly assembler = new FamilyPlanAssembler();

  constructor(private readonly http: HttpClient) {}

  getByFamilyId(familyId: number): Observable<FamilyPlan[]> {
    const params = new HttpParams().set('familyId', familyId);
    return this.http
      .get<FamilyPlanResource[]>(this.endpointUrl, { params })
      .pipe(map((response) => response.map((item) => this.assembler.toEntityFromResource(item))));
  }

  getActiveByFamilyId(familyId: number): Observable<FamilyPlan> {
    const params = new HttpParams().set('familyId', familyId);
    return this.http
      .get<FamilyPlanResource>(`${this.endpointUrl}/active`, { params })
      .pipe(map((response) => this.assembler.toEntityFromResource(response)));
  }

  getById(familyPlanId: number): Observable<FamilyPlan> {
    return this.http
      .get<FamilyPlanResource>(`${this.endpointUrl}/${familyPlanId}`)
      .pipe(map((response) => this.assembler.toEntityFromResource(response)));
  }

  create(payload: CreateFamilyPlanPayload): Observable<FamilyPlan> {
    return this.http
      .post<FamilyPlanResource>(this.endpointUrl, payload)
      .pipe(map((response) => this.assembler.toEntityFromResource(response)));
  }

  update(familyPlanId: number, payload: UpdateFamilyPlanPayload): Observable<FamilyPlan> {
    return this.http
      .put<FamilyPlanResource>(`${this.endpointUrl}/${familyPlanId}`, payload)
      .pipe(map((response) => this.assembler.toEntityFromResource(response)));
  }

  activate(familyPlanId: number): Observable<FamilyPlan> {
    return this.http
      .post<FamilyPlanResource>(`${this.endpointUrl}/${familyPlanId}/activate`, {})
      .pipe(map((response) => this.assembler.toEntityFromResource(response)));
  }

  complete(familyPlanId: number, ownerUserId: number): Observable<FamilyPlan> {
    const params = new HttpParams().set('ownerUserId', ownerUserId);
    return this.http
      .post<FamilyPlanResource>(`${this.endpointUrl}/${familyPlanId}/complete`, {}, { params })
      .pipe(map((response) => this.assembler.toEntityFromResource(response)));
  }

  delete(familyPlanId: number): Observable<FamilyPlan> {
    return this.http
      .delete<FamilyPlanResource>(`${this.endpointUrl}/${familyPlanId}`)
      .pipe(map((response) => this.assembler.toEntityFromResource(response)));
  }
}
