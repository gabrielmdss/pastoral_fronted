import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Competencia, GerarCompetenciaInput } from '../../domain/competencias/competencia.model';
export interface CompetenciasApiPort {
  listar(): Observable<Competencia[]>;
  obter(id: string): Observable<Competencia>;
  gerar(input: GerarCompetenciaInput): Observable<Competencia>;
}
export const COMPETENCIAS_API = new InjectionToken<CompetenciasApiPort>('COMPETENCIAS_API');

