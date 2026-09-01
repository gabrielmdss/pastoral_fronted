import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  BeneficiarioDetalhe,
  BeneficiarioResumo,
} from '../../domain/beneficiarios/beneficiario.model';
import type {
  AdmitirBeneficiarioInput,
  AlterarGrupoInput,
  BeneficiarioFiltro,
  DesligarBeneficiarioInput,
} from './beneficiarios.models';
export interface BeneficiariosApiPort {
  listar(filtro: BeneficiarioFiltro): Observable<BeneficiarioResumo[]>;
  obter(id: string): Observable<BeneficiarioDetalhe>;
  admitir(input: AdmitirBeneficiarioInput): Observable<{ id: string }>;
  desligar(id: string, input: DesligarBeneficiarioInput): Observable<void>;
  reativar(id: string): Observable<void>;
  alterarGrupo(id: string, input: AlterarGrupoInput): Observable<void>;
}
export const BENEFICIARIOS_API = new InjectionToken<BeneficiariosApiPort>('BENEFICIARIOS_API');
