import { Inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { Distribuicao } from '../../domain/distribuicoes/distribuicao.model';
import { DISTRIBUICOES_API, DistribuicoesApiPort } from './distribuicoes-api.port';


@Injectable()
export class ListarDistribuicoesUseCase {
  constructor(
    @Inject(DISTRIBUICOES_API)
    private readonly api: DistribuicoesApiPort,
  ) {}

  execute(): Observable<Distribuicao[]> {
    return this.api.listar();
  }
}