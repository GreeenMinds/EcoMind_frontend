import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SignInPayload } from '../domain/model/sign-in.command';
import { SignUpPayload } from '../domain/model/sign-up.command';
import { AuthenticatedUserResponse, CurrentUserResponse, PasswordRecoveryResponse } from './authentication-response';

const authenticationApiEndpointUrl =
  `${environment.platformProviderBackendApiBaseUrl}${environment.platformProviderAuthenticationEndpointPath}`;

@Injectable({
  providedIn: 'root',
})
export class IamApi {
  constructor(private readonly http: HttpClient) {}

  signIn(payload: SignInPayload): Observable<AuthenticatedUserResponse> {
    return this.http.post<AuthenticatedUserResponse>(`${authenticationApiEndpointUrl}/sign-in`, payload);
  }

  signUp(payload: SignUpPayload): Observable<AuthenticatedUserResponse> {
    return this.http.post<AuthenticatedUserResponse>(`${authenticationApiEndpointUrl}/sign-up`, payload);
  }

  me(): Observable<CurrentUserResponse> {
    return this.http.get<CurrentUserResponse>(`${authenticationApiEndpointUrl}/me`);
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${authenticationApiEndpointUrl}/logout`, {});
  }

  deleteAccount(): Observable<void> {
    return this.http.delete<void>(`${authenticationApiEndpointUrl}/me`);
  }

  requestPasswordRecovery(email: string): Observable<PasswordRecoveryResponse> {
    return this.http.post<PasswordRecoveryResponse>(`${authenticationApiEndpointUrl}/password-recovery/request`, {
      email,
    });
  }

  confirmPasswordRecovery(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${authenticationApiEndpointUrl}/password-recovery/confirm`, {
      token,
      newPassword,
    });
  }
}
