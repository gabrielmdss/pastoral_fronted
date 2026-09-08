import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Inventario } from '../../domain/estoque/inventario.model';
export interface InventariosApiPort {
  criar(): Observable<{ id: string }>;
  obter(id: string): Observable<Inventario | null>;
  contar(id: string, apresentacaoId: string, saldoFisico: number): Observable<void>;
  concluir(id: string): Observable<void>;
}
export const INVENTARIOS_API = new InjectionToken<InventariosApiPort>('INVENTARIOS_API');
