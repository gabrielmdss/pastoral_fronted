import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';
import { APP_CONFIG, AppConfig } from '../../config/app-config';
import type { RelatoriosApiPort } from '../../../application/relatorios/relatorios-api.port';
import type * as M from '../../../domain/relatorios/relatorios.model';
import type * as D from './relatorios-api.contracts';
import { mapDistribuicoes, mapBeneficiarios, mapEstoque } from './relatorios-api.mapper';
function params(values: Record<string, string | number | undefined>) {
  let result = new HttpParams();
  for (const [key, value] of Object.entries(values))
    if (value !== undefined && value !== '') result = result.set(key, value);
  return result;
}
@Injectable()
export class RelatoriosApiService implements RelatoriosApiPort {
  private readonly url: string;
  constructor(
    private http: HttpClient,
    @Inject(APP_CONFIG) config: AppConfig,
  ) {
    this.url = config.apiBaseUrl + '/relatorios';
  }
  distribuicoes(f: M.FiltroDistribuicoes) {
    return this.http
      .get<D.PaginaRelatorioDto<D.DistribuicaoRelatorioDto>>(this.url + '/distribuicoes', {
        params: params({
          page: f.page,
          limit: f.limit,
          dataInicio: f.dataInicio,
          dataFim: f.dataFim,
          competencia: f.competencia,
          grupoId: f.grupoId,
          status: f.status,
        }),
      })
      .pipe(map(mapDistribuicoes));
  }
  beneficiarios(f: M.FiltroBeneficiarios) {
    return this.http
      .get<D.PaginaRelatorioDto<D.BeneficiarioRelatorioDto>>(this.url + '/beneficiarios', {
        params: params({
          page: f.page,
          limit: f.limit,
          status: f.status,
          grupoId: f.grupoId,
          dataAdmissaoInicio: f.dataAdmissaoInicio,
          dataAdmissaoFim: f.dataAdmissaoFim,
        }),
      })
      .pipe(map(mapBeneficiarios));
  }
  estoque(f: M.FiltroEstoque) {
    return this.http
      .get<D.PaginaRelatorioDto<D.EstoqueRelatorioDto>>(this.url + '/estoque', {
        params: params({
          page: f.page,
          limit: f.limit,
          insumo: f.insumo,
          tipoMovimento: f.tipoMovimento,
          dataInicio: f.dataInicio,
          dataFim: f.dataFim,
        }),
      })
      .pipe(map(mapEstoque));
  }
}
