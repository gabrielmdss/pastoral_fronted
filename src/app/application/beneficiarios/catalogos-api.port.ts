import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { GrupoDistribuicao, MotivoDesligamento } from './catalogos.models';
export interface CatalogosApiPort {
  grupos(): Observable<GrupoDistribuicao[]>;
  motivos(): Observable<MotivoDesligamento[]>;
}
export const CATALOGOS_API = new InjectionToken<CatalogosApiPort>('CATALOGOS_API');
