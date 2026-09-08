import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { LiberacaoCestas, LiberarCestasInput } from '../../domain/liberacoes/liberacao.model';
export interface LiberacoesApiPort {
  listar(distribuicaoId: string): Observable<LiberacaoCestas[]>;
  liberar(distribuicaoId: string, input: LiberarCestasInput): Observable<{ id: string }>;
}
export const LIBERACOES_API = new InjectionToken<LiberacoesApiPort>('LIBERACOES_API');
