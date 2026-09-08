import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { APP_CONFIG, AppConfig } from '../../config/app-config';
import type { ModelosApiPort } from '../../../application/cestas/modelos-api.port';
import type { ModeloInput, VersaoModeloInput } from '../../../domain/cestas/modelo-cesta.model';
import type { ModeloDto, ModeloDetalheDto, VersaoModeloRequestDto } from './modelos-api.contracts';
import { mapModelo, mapModeloDetalhe } from './modelos-api.mapper';
@Injectable()
export class ModelosApiService implements ModelosApiPort {
  private url: string;
  constructor(
    private http: HttpClient,
    @Inject(APP_CONFIG) config: AppConfig,
  ) {
    this.url = config.apiBaseUrl + '/cestas/modelos';
  }
  listar() {
    return this.http.get<{ data: ModeloDto[] }>(this.url).pipe(map((r) => r.data.map(mapModelo)));
  }
  obter(id: string) {
    return this.http
      .get<{ data: ModeloDetalheDto | null }>(this.url + '/' + id)
      .pipe(map((r) => (r.data ? mapModeloDetalhe(r.data) : null)));
  }
  criar(input: ModeloInput) {
    return this.http.post<{ data: { id: string } }>(this.url, input).pipe(map((r) => r.data));
  }
  versao(id: string, input: VersaoModeloInput) {
    const body: VersaoModeloRequestDto = input;
    return this.http
      .post<{ data: { id: string; numeroVersao: number } }>(this.url + '/' + id + '/versoes', body)
      .pipe(map((r) => r.data));
  }
}
