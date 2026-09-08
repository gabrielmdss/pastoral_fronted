import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { APP_CONFIG, AppConfig } from '../../config/app-config';
import type { EstoqueApiPort } from '../../../application/estoque/estoque-api.port';
import type {
  InsumoInput,
  DoadorInput,
  EntradaInput,
  PerdaInput,
} from '../../../domain/estoque/estoque.model';
import type {
  CategoriaInsumoDto,
  InsumoSaldoDto,
  DoadorDto,
  EntradaRequestDto,
  PerdaRequestDto,
} from './estoque-api.contracts';
import { mapInsumo, mapCategoria, mapDoador } from './estoque-api.mapper';
type Data<T> = { data: T };
@Injectable()
export class EstoqueApiService implements EstoqueApiPort {
  private readonly base: string;
  constructor(
    private readonly http: HttpClient,
    @Inject(APP_CONFIG) config: AppConfig,
  ) {
    this.base = config.apiBaseUrl;
  }
  categorias() {
    return this.http
      .get<Data<CategoriaInsumoDto[]>>(this.base + '/estoque/categorias-prioridade')
      .pipe(map((r) => r.data.map(mapCategoria)));
  }
  listar() {
    return this.http
      .get<Data<InsumoSaldoDto[]>>(this.base + '/estoque/insumos')
      .pipe(map((r) => r.data.map(mapInsumo)));
  }
  obter(id: string) {
    return this.http
      .get<Data<InsumoSaldoDto | null>>(this.base + '/estoque/insumos/' + id)
      .pipe(map((r) => (r.data ? mapInsumo(r.data) : null)));
  }
  cadastrar(input: InsumoInput) {
    return this.http
      .post<Data<{ id: string; apresentacaoId: string }>>(this.base + '/estoque/insumos', input)
      .pipe(map((r) => r.data));
  }
  doadores() {
    return this.http
      .get<Data<DoadorDto[]>>(this.base + '/doadores')
      .pipe(map((r) => r.data.map(mapDoador)));
  }
  criarDoador(input: DoadorInput) {
    return this.http
      .post<Data<{ id: string }>>(this.base + '/doadores', input)
      .pipe(map((r) => r.data));
  }
  atualizarDoador(id: string, input: DoadorInput & { ativo: boolean }) {
    return this.http.put<void>(this.base + '/doadores/' + id, input);
  }
  entrada(input: EntradaInput) {
    const body: EntradaRequestDto = input;
    return this.http
      .post<Data<{ id: string }>>(this.base + '/estoque/entradas', body)
      .pipe(map((r) => r.data));
  }
  perda(input: PerdaInput) {
    const body: PerdaRequestDto = input;
    return this.http
      .post<Data<{ id: string }>>(this.base + '/estoque/perdas', body)
      .pipe(map((r) => r.data));
  }
}
