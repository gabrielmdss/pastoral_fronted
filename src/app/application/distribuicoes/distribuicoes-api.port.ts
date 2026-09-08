import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

import type { Distribuicao, RemarcarDistribuicaoInput } from '../../domain/distribuicoes/distribuicao.model';

export interface DistribuicoesApiPort {
  remarcar(id: string, input: RemarcarDistribuicaoInput): Observable<void>;
  listar(): Observable<Distribuicao[]>;

  obterPorId(id: string): Observable<Distribuicao>;

  abrir(id: string): Observable<void>;

  encerrar(id: string): Observable<void>;
}

export const DISTRIBUICOES_API =
  new InjectionToken<DistribuicoesApiPort>('DISTRIBUICOES_API');
