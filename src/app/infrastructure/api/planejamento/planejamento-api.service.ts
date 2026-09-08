import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { APP_CONFIG, AppConfig } from '../../config/app-config';
import type { PlanejamentoApiPort } from '../../../application/planejamento/planejamento-api.port';
import type {
  PlanejamentoInput,
  RevisaoPlanejamentoInput,
} from '../../../domain/planejamento/planejamento.model';
import type {
  PlanejamentoDto,
  PlanejamentoDetalheDto,
  SimulacaoDto,
  PlanejamentoRequestDto,
  RevisaoRequestDto,
} from './planejamento-api.contracts';
import { mapPlanejamento, mapPlanejamentoDetalhe, mapSimulacao } from './planejamento-api.mapper';
@Injectable()
export class PlanejamentoApiService implements PlanejamentoApiPort {
  private readonly url: string;
  constructor(
    private http: HttpClient,
    @Inject(APP_CONFIG) config: AppConfig,
  ) {
    this.url = config.apiBaseUrl + '/planejamentos';
  }
  listar() {
    return this.http
      .get<{ data: PlanejamentoDto[] }>(this.url)
      .pipe(map((r) => r.data.map(mapPlanejamento)));
  }
  obter(id: string) {
    return this.http
      .get<{ data: PlanejamentoDetalheDto | null }>(this.url + '/' + id)
      .pipe(map((r) => (r.data ? mapPlanejamentoDetalhe(r.data) : null)));
  }
  simular(input: PlanejamentoInput) {
    const body: PlanejamentoRequestDto = {
      competenciaId: input.competenciaId,
      modeloCestaVersaoId: input.modeloCestaVersaoId,
      quantidade: input.quantidade,
    };
    return this.http
      .post<{ data: SimulacaoDto }>(this.url + '/simular', body)
      .pipe(map((r) => mapSimulacao(r.data)));
  }
  criar(input: PlanejamentoInput) {
    const body: PlanejamentoRequestDto = {
      competenciaId: input.competenciaId,
      modeloCestaVersaoId: input.modeloCestaVersaoId,
      quantidade: input.quantidade,
    };
    return this.http
      .post<{ data: { id: string; versaoId: string } }>(this.url, body)
      .pipe(map((r) => r.data));
  }
  revisar(id: string, input: RevisaoPlanejamentoInput) {
    const body: RevisaoRequestDto = {
      quantidade: input.quantidade,
      modeloCestaVersaoId: input.modeloCestaVersaoId,
      motivo: input.motivo,
    };
    return this.http
      .post<{ data: { versaoId: string } }>(this.url + '/' + id + '/revisoes', body)
      .pipe(map((r) => r.data));
  }
  aprovar(id: string) {
    return this.http.post<void>(this.url + '/' + id + '/aprovar', {});
  }
}
