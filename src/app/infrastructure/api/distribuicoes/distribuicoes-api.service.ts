import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';

import { DistribuicoesApiPort } from '../../../application/distribuicoes/distribuicoes-api.port';
import type { Distribuicao, RemarcarDistribuicaoInput } from '../../../domain/distribuicoes/distribuicao.model';
import type { RemarcarDistribuicaoRequestDto } from './distribuicoes-api.contracts';
import { APP_CONFIG, type AppConfig } from '../../config/app-config';
import { mapDistribuicaoDto } from './distribuicoes-api.mapper';
import { DistribuicaoDto, ListarDistribuicoesResponseDto } from './distribuicoes-api.contracts';
import { DataResponse } from '../beneficiarios/beneficiarios-api.contracts';

@Injectable()
export class DistribuicoesApiService implements DistribuicoesApiPort {
  private readonly url: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(APP_CONFIG) config: AppConfig,
  ) {
    this.url = `${config.apiBaseUrl}/distribuicoes`;
  }

  listar(): Observable<Distribuicao[]> {
    return this.http
      .get<ListarDistribuicoesResponseDto>(this.url)
      .pipe(
        map((response) =>
          response.data.map(mapDistribuicaoDto),
        ),
      );
  }

  obterPorId(id: string): Observable<Distribuicao> {
    return this.http
      .get<DataResponse<DistribuicaoDto>>(`${this.url}/${id}`)
      .pipe(
        map((response) => mapDistribuicaoDto(response.data)),
      );
  }

  abrir(id: string): Observable<void> {
    return this.http.post<void>(
      `${this.url}/${id}/abrir`,
      {},
    );
  }

  encerrar(id: string): Observable<void> {
    return this.http.post<void>(
      `${this.url}/${id}/encerrar`,
      {},
    );
  }
  remarcar(id: string, input: RemarcarDistribuicaoInput): Observable<void> {
    const body: RemarcarDistribuicaoRequestDto = { novaData: input.novaData, motivo: input.motivo };
    return this.http.post<void>(`${this.url}/${id}/remarcar`, body);
  }
}
