import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';

import type { AtendimentoApiPort } from '../../../application/atendimento/atendimento-api.port';
import type {
  CheckIn,
  CheckInClassificacao,
  CheckInSituacaoOperacional,
} from '../../../domain/atendimento/check-in.model';
import { APP_CONFIG, type AppConfig } from '../../config/app-config';

import type {
  CheckInDto,
  DataResponse,
  RegistrarRetiradaDto,
  RetiradaDto,
  HistoricoBeneficiarioDto,
  RegistrarJustificativaDto,
  AvaliarJustificativaDto,
} from './atendimento-api.contracts';

import { mapAusenciasHistoricoDto, mapCheckInDto, mapRetiradaDto } from './atendimento-api.mapper';
import type { Retirada } from '../../../domain/atendimento/retirada.model';
import type { RegistrarRetiradaInput } from '../../../domain/atendimento/retirada.model';
import type { AusenciaAtendimento, AvaliarJustificativaInput, RegistrarJustificativaInput } from '../../../domain/atendimento/justificativa.model';

@Injectable()
export class AtendimentoApiService implements AtendimentoApiPort {
  private readonly distribuicoesUrl: string;
  private readonly apiBaseUrl: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(APP_CONFIG) config: AppConfig,
  ) {
    this.apiBaseUrl = config.apiBaseUrl;
    this.distribuicoesUrl = `${config.apiBaseUrl}/distribuicoes`;
  }

  listarCheckIns(
    distribuicaoId: string,
    classificacao?: CheckInClassificacao,
    situacao?: CheckInSituacaoOperacional,
  ): Observable<CheckIn[]> {
    let params = new HttpParams();

    if (classificacao) {
      params = params.set('classificacao', classificacao);
    }

    if (situacao) {
      params = params.set('situacao', situacao);
    }

    return this.http
      .get<DataResponse<CheckInDto[]>>(
        `${this.distribuicoesUrl}/${distribuicaoId}/check-ins`,
        { params },
      )
      .pipe(
        map((response) =>
          response.data.map(mapCheckInDto),
        ),
      );
  }

  registrarCheckIn(
    distribuicaoId: string,
    beneficiarioId: string,
  ): Observable<CheckIn> {
    return this.http
      .post<DataResponse<CheckInDto>>(
        `${this.distribuicoesUrl}/${distribuicaoId}/check-ins`,
        {
          beneficiarioId,
        },
      )
      .pipe(
        map((response) =>
          mapCheckInDto(response.data),
        ),
      );
  }

  listarRetiradas(distribuicaoId: string): Observable<Retirada[]> {
    return this.http
      .get<DataResponse<RetiradaDto[]>>(
        `${this.distribuicoesUrl}/${distribuicaoId}/retiradas`,
      )
      .pipe(map((response) => response.data.map(mapRetiradaDto)));
  }

  registrarRetirada(
    distribuicaoId: string,
    input: RegistrarRetiradaInput,
  ): Observable<{ id: string }> {
    const payload: RegistrarRetiradaDto = input;

    return this.http
      .post<DataResponse<{ id: string }>>(
        `${this.distribuicoesUrl}/${distribuicaoId}/retiradas`,
        payload,
      )
      .pipe(map((response) => response.data));
  }

  estornarRetirada(retiradaId: string, motivo: string): Observable<void> {
    return this.http.post<void>(
      `${this.apiBaseUrl}/retiradas/${retiradaId}/estornar`,
      { motivo },
    );
  }

  listarAusenciasBeneficiario(beneficiarioId: string): Observable<AusenciaAtendimento[]> {
    return this.http
      .get<DataResponse<HistoricoBeneficiarioDto>>(
        `${this.apiBaseUrl}/beneficiarios/${beneficiarioId}/historico`,
      )
      .pipe(map((response) => mapAusenciasHistoricoDto(response.data)));
  }

  registrarJustificativa(
    ausenciaId: string,
    input: RegistrarJustificativaInput,
  ): Observable<{ id: string }> {
    const payload: RegistrarJustificativaDto = input;
    return this.http
      .post<DataResponse<{ id: string }>>(
        `${this.apiBaseUrl}/ausencias/${ausenciaId}/justificativas`,
        payload,
      )
      .pipe(map((response) => response.data));
  }

  avaliarJustificativa(
    justificativaId: string,
    input: AvaliarJustificativaInput,
  ): Observable<void> {
    const payload: AvaliarJustificativaDto = input;
    return this.http.post<void>(
      `${this.apiBaseUrl}/justificativas/${justificativaId}/avaliar`,
      payload,
    );
  }
}
