import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { AuthenticatedUser } from '../../../domain/auth/authenticated-user.model';
import type { LoginInput, LoginResult } from '../models/login.model';

export interface AuthApiPort {
  login(input: LoginInput): Observable<LoginResult>;
  me(): Observable<AuthenticatedUser>;
}
export const AUTH_API = new InjectionToken<AuthApiPort>('AUTH_API');
