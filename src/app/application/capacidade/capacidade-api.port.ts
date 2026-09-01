import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { AlterarCapacidadeInput, Capacidade } from './capacidade.model';
export interface CapacidadeApiPort {
  obter(): Observable<Capacidade>;
  alterar(input: AlterarCapacidadeInput): Observable<Capacidade>;
}
export const CAPACIDADE_API = new InjectionToken<CapacidadeApiPort>('CAPACIDADE_API');
