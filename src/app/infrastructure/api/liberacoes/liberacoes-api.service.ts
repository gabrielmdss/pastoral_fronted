import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { APP_CONFIG, AppConfig } from '../../config/app-config';
import type { LiberacoesApiPort } from '../../../application/liberacoes/liberacoes-api.port';
import type { LiberarCestasInput } from '../../../domain/liberacoes/liberacao.model';
import type { LiberacaoCestasDto, LiberarCestasRequest } from './liberacoes-api.contracts';
import { mapLiberacao } from './liberacoes-api.mapper';
@Injectable()
export class LiberacoesApiService implements LiberacoesApiPort {
  constructor(
    private readonly http: HttpClient,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}
  private url(id: string) {
    return this.config.apiBaseUrl + '/distribuicoes/' + id + '/liberacoes-cestas';
  }
  listar(id: string) {
    return this.http
      .get<{ data: LiberacaoCestasDto[] }>(this.url(id))
      .pipe(map((r) => r.data.map(mapLiberacao)));
  }
  liberar(id: string, input: LiberarCestasInput) {
    const body: LiberarCestasRequest = {
      loteMontagemId: input.loteMontagemId,
      quantidade: input.quantidade,
    };
    return this.http.post<{ data: { id: string } }>(this.url(id), body).pipe(map((r) => r.data));
  }
}
