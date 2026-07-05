export interface AuthenticatedUserResponse {
  id: number;
  name: string;
  email: string;
  token: string;
}

export interface CurrentUserResponse {
  id: number;
  email: string;
  name: string;
}

export interface PasswordRecoveryResponse {
  email: string;
  sent: boolean;
}
