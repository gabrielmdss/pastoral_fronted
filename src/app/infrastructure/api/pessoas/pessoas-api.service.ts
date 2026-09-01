import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import type { PessoasApiPort } from '../../../application/pessoas/pessoas-api.port';
import type { CriarPessoaInput, PessoaFiltro } from '../../../application/pessoas/pessoas.models';
import type { Pessoa } from '../../../domain/pessoas/pessoa.model';
import { APP_CONFIG, type AppConfig } from '../../config/app-config';
interface Data<T> {
  data: T;
}
@Injectable()
export class PessoasApiService implements PessoasApiPort {
  private readonly url: string;
  constructor(
    private readonly http: HttpClient,
    @Inject(APP_CONFIG) c: AppConfig,
  ) {
    this.url = `${c.apiBaseUrl}/pessoas`;
  }
  buscar(f: PessoaFiltro) {
    let p = new HttpParams();
    if (f.q) p = p.set('q', f.q);
    if (f.documento) p = p.set('documento', f.documento);
    return this.http.get<Data<Pessoa[]>>(this.url, { params: p }).pipe(map((r) => r.data));
  }
  obter(id: string) {
    return this.http.get<Data<Pessoa>>(`${this.url}/${id}`).pipe(map((r) => r.data));
  }
  criar(i: CriarPessoaInput) {
    return this.http.post<Data<{ id: string }>>(this.url, i).pipe(map((r) => r.data));
  }
}
