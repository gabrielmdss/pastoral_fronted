import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { AuthenticatedUser } from '../../../domain/auth/authenticated-user.model';
import type { LoginInput, LoginResult } from '../models/login.model';
import type { AlterarSenhaInput } from '../models/alterar-senha.model';

export interface AuthApiPort {
  login(input: LoginInput): Observable<LoginResult>;
  me(): Observable<AuthenticatedUser>;
  alterarSenha(input: AlterarSenhaInput): Observable<void>;
}
export const AUTH_API = new InjectionToken<AuthApiPort>('AUTH_API');
