import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  AuditoriaFiltro,
  PaginaAuditoria,
  RegistroAuditoriaDetalhe,
} from '../../domain/auditoria/auditoria.model';
export interface AuditoriaApiPort {
  listar(filtro: AuditoriaFiltro): Observable<PaginaAuditoria>;
  obter(id: string): Observable<RegistroAuditoriaDetalhe>;
}
export const AUDITORIA_API = new InjectionToken<AuditoriaApiPort>('AUDITORIA_API');
