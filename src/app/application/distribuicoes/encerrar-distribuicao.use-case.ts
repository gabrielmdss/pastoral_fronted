import { Inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { DISTRIBUICOES_API, DistribuicoesApiPort } from './distribuicoes-api.port';


@Injectable()
export class EncerrarDistribuicaoUseCase {
  constructor(
    @Inject(DISTRIBUICOES_API)
    private readonly api: DistribuicoesApiPort,
  ) {}

  execute(id: string): Observable<void> {
    return this.api.encerrar(id);
  }
}