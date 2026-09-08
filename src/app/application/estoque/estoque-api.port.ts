import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  CategoriaInsumo,
  InsumoSaldo,
  Doador,
  DoadorInput,
  InsumoInput,
  EntradaInput,
  PerdaInput,
} from '../../domain/estoque/estoque.model';
export interface EstoqueApiPort {
  categorias(): Observable<CategoriaInsumo[]>;
  listar(): Observable<InsumoSaldo[]>;
  obter(id: string): Observable<InsumoSaldo | null>;
  cadastrar(input: InsumoInput): Observable<{ id: string; apresentacaoId: string }>;
  doadores(): Observable<Doador[]>;
  criarDoador(input: DoadorInput): Observable<{ id: string }>;
  atualizarDoador(id: string, input: DoadorInput & { ativo: boolean }): Observable<void>;
  entrada(input: EntradaInput): Observable<{ id: string }>;
  perda(input: PerdaInput): Observable<{ id: string }>;
}
export const ESTOQUE_API = new InjectionToken<EstoqueApiPort>('ESTOQUE_API');
