import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type * as M from '../../domain/relatorios/relatorios.model';
export interface RelatoriosApiPort {
  distribuicoes(f: M.FiltroDistribuicoes): Observable<M.PaginaRelatorio<M.LinhaDistribuicao>>;
  beneficiarios(f: M.FiltroBeneficiarios): Observable<M.PaginaRelatorio<M.LinhaBeneficiario>>;
  estoque(f: M.FiltroEstoque): Observable<M.PaginaRelatorio<M.LinhaEstoque>>;
}
export const RELATORIOS_API = new InjectionToken<RelatoriosApiPort>('RELATORIOS_API');
