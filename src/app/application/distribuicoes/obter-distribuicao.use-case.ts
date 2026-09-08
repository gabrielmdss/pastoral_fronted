import { Inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { Distribuicao } from '../../domain/distribuicoes/distribuicao.model';
import { DISTRIBUICOES_API, DistribuicoesApiPort } from './distribuicoes-api.port';


@Injectable()
export class ObterDistribuicaoUseCase {
  constructor(
    @Inject(DISTRIBUICOES_API)
    private readonly api: DistribuicoesApiPort,
  ) {}

  execute(id: string): Observable<Distribuicao> {
    return this.api.obterPorId(id);
  }
}