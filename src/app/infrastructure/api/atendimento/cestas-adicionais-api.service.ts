import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { APP_CONFIG, AppConfig } from '../../config/app-config';
import type { CestasAdicionaisApiPort } from '../../../application/atendimento/ports/cestas-adicionais-api.port';
import type { AutorizarCestaAdicionalInput } from '../../../domain/atendimento/cesta-adicional.model';
import type {
  CestaAdicionalDto,
  AutorizarCestaAdicionalRequest,
} from './cestas-adicionais-api.contracts';
import { mapCestaAdicional } from './cestas-adicionais-api.mapper';
@Injectable()
export class CestasAdicionaisApiService implements CestasAdicionaisApiPort {
  constructor(
    private http: HttpClient,
    @Inject(APP_CONFIG) private config: AppConfig,
  ) {}
  private url(id: string) {
    return this.config.apiBaseUrl + '/distribuicoes/' + id + '/cestas-adicionais';
  }
  listar(id: string) {
    return this.http
      .get<{ data: CestaAdicionalDto[] }>(this.url(id))
      .pipe(map((r) => r.data.map(mapCestaAdicional)));
  }
  autorizar(id: string, input: AutorizarCestaAdicionalInput) {
    const body: AutorizarCestaAdicionalRequest = {
      beneficiarioId: input.beneficiarioId,
      modeloCestaId: input.modeloCestaId,
      quantidade: input.quantidade,
      justificativa: input.justificativa,
    };
    return this.http
      .post<{ data: CestaAdicionalDto }>(this.url(id), body)
      .pipe(map((r) => mapCestaAdicional(r.data)));
  }
  entregar(id: string) {
    return this.http
      .post<{ data: CestaAdicionalDto }>(
        this.config.apiBaseUrl + '/cestas-adicionais/' + id + '/entregar',
        {},
      )
      .pipe(map((r) => mapCestaAdicional(r.data)));
  }
}
