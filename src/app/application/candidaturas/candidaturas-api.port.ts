import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Candidatura } from '../../domain/candidaturas/candidatura.model';
import type {
  AdmitirCandidaturaInput,
  CandidaturaFiltro,
  ContatoInput,
} from './candidaturas.models';
export interface CandidaturasApiPort {
  listar(f: CandidaturaFiltro): Observable<Candidatura[]>;
  criar(pessoaId: string): Observable<{ id: string }>;
  priorizar(id: string, justificativa: string): Observable<void>;
  registrarContato(id: string, input: ContatoInput): Observable<void>;
  marcarNaoLocalizado(id: string): Observable<void>;
  admitir(id: string, input: AdmitirCandidaturaInput): Observable<{ beneficiarioId: string }>;
}
export const CANDIDATURAS_API = new InjectionToken<CandidaturasApiPort>('CANDIDATURAS_API');
