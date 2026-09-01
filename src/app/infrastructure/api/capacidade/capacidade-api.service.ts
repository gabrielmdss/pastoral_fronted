import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import type { CapacidadeApiPort } from '../../../application/capacidade/capacidade-api.port';
import type {
  AlterarCapacidadeInput,
  Capacidade,
} from '../../../application/capacidade/capacidade.model';
import { APP_CONFIG, type AppConfig } from '../../config/app-config';
@Injectable()
export class CapacidadeApiService implements CapacidadeApiPort {
  private readonly url: string;
  constructor(
    private readonly http: HttpClient,
    @Inject(APP_CONFIG) c: AppConfig,
  ) {
    this.url = `${c.apiBaseUrl}/capacidade`;
  }
  obter() {
    return this.http.get<{ data: Capacidade }>(this.url).pipe(map((r) => r.data));
  }
  alterar(i: AlterarCapacidadeInput) {
    return this.http.put<{ data: Capacidade }>(this.url, i).pipe(map((r) => r.data));
  }
}
