import { Inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { AlterarSenhaInput } from '../models/alterar-senha.model';
import { AUTH_API, type AuthApiPort } from '../ports/auth-api.port';

@Injectable()
export class AlterarSenhaUseCase {
  constructor(@Inject(AUTH_API) private readonly api: AuthApiPort) {}
  execute(input: AlterarSenhaInput): Observable<void> {
    return this.api.alterarSenha(input);
  }
}
