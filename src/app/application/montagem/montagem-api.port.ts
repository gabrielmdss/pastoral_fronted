import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  LoteMontagem,
  MontarLoteInput,
  AjustarLoteInput,
  DesmontarLoteInput,
} from '../../domain/montagem/montagem.model';
export interface MontagemApiPort {
  listar(): Observable<LoteMontagem[]>;
  obter(id: string): Observable<LoteMontagem | null>;
  montar(input: MontarLoteInput): Observable<{ id: string }>;
  ajustar(id: string, input: AjustarLoteInput): Observable<{ id: string }>;
  desmontar(id: string, input: DesmontarLoteInput): Observable<void>;
}
export const MONTAGEM_API = new InjectionToken<MontagemApiPort>('MONTAGEM_API');
