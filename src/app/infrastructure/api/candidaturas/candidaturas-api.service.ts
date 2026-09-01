import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import type { CandidaturasApiPort } from '../../../application/candidaturas/candidaturas-api.port';
import type {
  AdmitirCandidaturaInput,
  CandidaturaFiltro,
  ContatoInput,
} from '../../../application/candidaturas/candidaturas.models';
import { APP_CONFIG, type AppConfig } from '../../config/app-config';
import type { CandidaturaDto, DataResponse } from './candidaturas-api.contracts';
import { mapCandidatura } from './candidaturas-api.mapper';
@Injectable()
export class CandidaturasApiService implements CandidaturasApiPort {
  private readonly url: string;
  constructor(
    private readonly http: HttpClient,
    @Inject(APP_CONFIG) c: AppConfig,
  ) {
    this.url = `${c.apiBaseUrl}/candidaturas`;
  }
  listar(f: CandidaturaFiltro) {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(f)) if (v) params = params.set(k, v);
    return this.http
      .get<DataResponse<CandidaturaDto[]>>(this.url, { params })
      .pipe(map((r) => r.data.map(mapCandidatura)));
  }
  criar(pessoaId: string) {
    return this.http
      .post<DataResponse<{ id: string }>>(this.url, { pessoaId })
      .pipe(map((r) => r.data));
  }
  priorizar(id: string, justificativa: string) {
    return this.http.post<void>(`${this.url}/${id}/priorizar`, { justificativa });
  }
  registrarContato(id: string, input: ContatoInput) {
    return this.http.post<void>(`${this.url}/${id}/tentativas-contato`, input);
  }
  marcarNaoLocalizado(id: string) {
    return this.http.post<void>(`${this.url}/${id}/nao-localizado`, {});
  }
  admitir(id: string, input: AdmitirCandidaturaInput) {
    return this.http
      .post<DataResponse<{ beneficiarioId: string }>>(`${this.url}/${id}/admitir`, input)
      .pipe(map((r) => r.data));
  }
}
