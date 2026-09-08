import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { APP_CONFIG, AppConfig } from '../../config/app-config';
import type { InventariosApiPort } from '../../../application/estoque/inventarios-api.port';
import type { InventarioDto, ContagemInventarioRequest } from './inventarios-api.contracts';
import { mapInventario } from './inventarios-api.mapper';
@Injectable()
export class InventariosApiService implements InventariosApiPort {
  private readonly url: string;
  constructor(
    private http: HttpClient,
    @Inject(APP_CONFIG) config: AppConfig,
  ) {
    this.url = config.apiBaseUrl + '/estoque/inventarios';
  }
  criar() {
    return this.http.post<{ data: { id: string } }>(this.url, {}).pipe(map((r) => r.data));
  }
  obter(id: string) {
    return this.http
      .get<{ data: InventarioDto | null }>(this.url + '/' + id)
      .pipe(map((r) => (r.data ? mapInventario(r.data) : null)));
  }
  contar(id: string, apresentacaoId: string, saldoFisico: number) {
    const body: ContagemInventarioRequest = { saldoFisico };
    return this.http.put<void>(this.url + '/' + id + '/itens/' + apresentacaoId, body);
  }
  concluir(id: string) {
    return this.http.post<void>(this.url + '/' + id + '/concluir', {});
  }
}
