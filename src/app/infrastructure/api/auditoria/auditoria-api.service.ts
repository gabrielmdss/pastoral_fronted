import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { APP_CONFIG, AppConfig } from '../../config/app-config';
import type { AuditoriaApiPort } from '../../../application/auditoria/auditoria-api.port';
import type { AuditoriaFiltro } from '../../../domain/auditoria/auditoria.model';
import type { PaginaAuditoriaDto, RegistroAuditoriaDetalheDto } from './auditoria-api.contracts';
import { mapPaginaAuditoria, mapRegistroAuditoriaDetalhe } from './auditoria-api.mapper';
function params(values: Record<string, string | number | undefined>) {
  let result = new HttpParams();
  for (const [key, value] of Object.entries(values)) {
    const text = value === undefined ? '' : String(value).trim();
    if (text !== '') result = result.set(key, text);
  }
  return result;
}
@Injectable()
export class AuditoriaApiService implements AuditoriaApiPort {
  private readonly url: string;
  constructor(
    private readonly http: HttpClient,
    @Inject(APP_CONFIG) config: AppConfig,
  ) {
    this.url = config.apiBaseUrl + '/auditoria';
  }
  listar(f: AuditoriaFiltro) {
    return this.http
      .get<PaginaAuditoriaDto>(this.url, {
        params: params({
          page: f.page,
          limit: f.limit,
          usuarioId: f.usuarioId,
          entidade: f.entidade,
          entidadeId: f.entidadeId,
          operacao: f.operacao,
          dataInicio: f.dataInicio,
          dataFim: f.dataFim,
        }),
      })
      .pipe(map(mapPaginaAuditoria));
  }
  obter(id: string) {
    return this.http
      .get<{ data: RegistroAuditoriaDetalheDto }>(this.url + '/' + encodeURIComponent(id))
      .pipe(map((r) => mapRegistroAuditoriaDetalhe(r.data)));
  }
}
