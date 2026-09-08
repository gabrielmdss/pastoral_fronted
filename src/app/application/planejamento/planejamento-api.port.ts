import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  Planejamento,
  PlanejamentoDetalhe,
  PlanejamentoInput,
  RevisaoPlanejamentoInput,
  SimulacaoPlanejamento,
} from '../../domain/planejamento/planejamento.model';
export interface PlanejamentoApiPort {
  listar(): Observable<Planejamento[]>;
  obter(id: string): Observable<PlanejamentoDetalhe | null>;
  simular(input: PlanejamentoInput): Observable<SimulacaoPlanejamento>;
  criar(input: PlanejamentoInput): Observable<{ id: string; versaoId: string }>;
  revisar(id: string, input: RevisaoPlanejamentoInput): Observable<{ versaoId: string }>;
  aprovar(id: string): Observable<void>;
}
export const PLANEJAMENTO_API = new InjectionToken<PlanejamentoApiPort>('PLANEJAMENTO_API');
