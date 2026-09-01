import { Inject, Injectable } from '@angular/core';
import { switchMap, tap, type Observable } from 'rxjs';
import type { AuthenticatedUser } from '../../../domain/auth/authenticated-user.model';
import type { LoginInput } from '../models/login.model';
import { AUTH_API, type AuthApiPort } from '../ports/auth-api.port';
import { SESSION_STORAGE, type SessionStoragePort } from '../ports/session-storage.port';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(AUTH_API) private readonly api: AuthApiPort,
    @Inject(SESSION_STORAGE) private readonly storage: SessionStoragePort,
  ) {}
  execute(input: LoginInput): Observable<AuthenticatedUser> {
    return this.api.login(input).pipe(
      tap(({ accessToken }) => this.storage.setAccessToken(accessToken)),
      switchMap(() => this.api.me()),
    );
  }
}
