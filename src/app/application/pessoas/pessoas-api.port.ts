import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Pessoa } from '../../domain/pessoas/pessoa.model';
import type { CriarPessoaInput, PessoaFiltro } from './pessoas.models';
export interface PessoasApiPort {
  buscar(f: PessoaFiltro): Observable<Pessoa[]>;
  obter(id: string): Observable<Pessoa>;
  criar(input: CriarPessoaInput): Observable<{ id: string }>;
}
export const PESSOAS_API = new InjectionToken<PessoasApiPort>('PESSOAS_API');
