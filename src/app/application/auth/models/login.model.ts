import type { AuthenticatedUser } from '../../../domain/auth/authenticated-user.model';

export interface LoginInput {
  login: string;
  senha: string;
}
export interface LoginResult {
  accessToken: string;
  usuario: AuthenticatedUser;
}
