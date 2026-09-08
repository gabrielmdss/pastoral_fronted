import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  ModeloCesta,
  ModeloDetalhe,
  ModeloInput,
  VersaoModeloInput,
} from '../../domain/cestas/modelo-cesta.model';
export interface ModelosApiPort {
  listar(): Observable<ModeloCesta[]>;
  obter(id: string): Observable<ModeloDetalhe | null>;
  criar(input: ModeloInput): Observable<{ id: string }>;
  versao(id: string, input: VersaoModeloInput): Observable<{ id: string; numeroVersao: number }>;
}
export const MODELOS_API = new InjectionToken<ModelosApiPort>('MODELOS_API');
