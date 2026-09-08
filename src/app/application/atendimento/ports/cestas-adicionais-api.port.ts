import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  CestaAdicional,
  AutorizarCestaAdicionalInput,
} from '../../../domain/atendimento/cesta-adicional.model';
export interface CestasAdicionaisApiPort {
  listar(distribuicaoId: string): Observable<CestaAdicional[]>;
  autorizar(
    distribuicaoId: string,
    input: AutorizarCestaAdicionalInput,
  ): Observable<CestaAdicional>;
  entregar(id: string): Observable<CestaAdicional>;
}
export const CESTAS_ADICIONAIS_API = new InjectionToken<CestasAdicionaisApiPort>(
  'CESTAS_ADICIONAIS_API',
);
