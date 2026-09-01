import { Inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { AuthenticatedUser } from '../../../domain/auth/authenticated-user.model';
import { AUTH_API, type AuthApiPort } from '../ports/auth-api.port';

@Injectable()
export class GetCurrentUserUseCase {
  constructor(@Inject(AUTH_API) private readonly api: AuthApiPort) {}
  execute(): Observable<AuthenticatedUser> {
    return this.api.me();
  }
}
