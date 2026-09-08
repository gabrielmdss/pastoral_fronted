import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { APP_CONFIG, AppConfig } from '../../config/app-config';
import type { MontagemApiPort } from '../../../application/montagem/montagem-api.port';
import type {
  MontarLoteInput,
  AjustarLoteInput,
  DesmontarLoteInput,
} from '../../../domain/montagem/montagem.model';
import type {
  LoteMontagemDto,
  MontarLoteRequest,
  AjustarLoteRequest,
  DesmontarLoteRequest,
} from './montagem-api.contracts';
import { mapLote } from './montagem-api.mapper';
@Injectable()
export class MontagemApiService implements MontagemApiPort {
  private readonly url: string;
  constructor(
    private http: HttpClient,
    @Inject(APP_CONFIG) config: AppConfig,
  ) {
    this.url = config.apiBaseUrl + '/estoque/lotes-montagem';
  }
  listar() {
    return this.http
      .get<{ data: LoteMontagemDto[] }>(this.url)
      .pipe(map((r) => r.data.map(mapLote)));
  }
  obter(id: string) {
    return this.http
      .get<{ data: LoteMontagemDto | null }>(this.url + '/' + id)
      .pipe(map((r) => (r.data ? mapLote(r.data) : null)));
  }
  montar(input: MontarLoteInput) {
    const body: MontarLoteRequest = {
      planejamentoVersaoId: input.planejamentoVersaoId,
      quantidade: input.quantidade,
    };
    return this.http.post<{ data: { id: string } }>(this.url, body).pipe(map((r) => r.data));
  }
  ajustar(id: string, input: AjustarLoteInput) {
    const body: AjustarLoteRequest = {
      quantidadeCestasAfetadas: input.quantidadeCestasAfetadas,
      motivo: input.motivo,
      itens: input.itens.map((i) => ({
        apresentacaoInsumoId: i.apresentacaoInsumoId,
        operacao: i.operacao,
        quantidadePorCesta: i.quantidadePorCesta,
      })),
    };
    return this.http
      .post<{ data: { id: string } }>(this.url + '/' + id + '/ajustes', body)
      .pipe(map((r) => r.data));
  }
  desmontar(id: string, input: DesmontarLoteInput) {
    const body: DesmontarLoteRequest = { quantidade: input.quantidade, motivo: input.motivo };
    return this.http.post<void>(this.url + '/' + id + '/desmontar', body);
  }
}
