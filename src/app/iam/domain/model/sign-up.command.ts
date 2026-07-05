export interface SignUpPayload {
  name: string;
  email: string;
  password: string;
  birthDate?: string;
  commitment?: string | null;
}
