export interface SignUpPayload {
  name: string;
  email: string;
  password: string;
  communityId: number;
  birthDate?: string;
  commitment?: string | null;
}
