import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

import type {
  CheckIn,
  CheckInClassificacao,
  CheckInSituacaoOperacional,
} from '../../domain/atendimento/check-in.model';
import type {
  RegistrarRetiradaInput,
  Retirada,
} from '../../domain/atendimento/retirada.model';
import type {
  AusenciaAtendimento,
  AvaliarJustificativaInput,
  RegistrarJustificativaInput,
} from '../../domain/atendimento/justificativa.model';

export interface AtendimentoApiPort {
  listarCheckIns(
    distribuicaoId: string,
    classificacao?: CheckInClassificacao,
    situacao?: CheckInSituacaoOperacional,
  ): Observable<CheckIn[]>;

  registrarCheckIn(
    distribuicaoId: string,
    beneficiarioId: string,
  ): Observable<CheckIn>;

  listarRetiradas(distribuicaoId: string): Observable<Retirada[]>;

  registrarRetirada(
    distribuicaoId: string,
    input: RegistrarRetiradaInput,
  ): Observable<{ id: string }>;

  estornarRetirada(retiradaId: string, motivo: string): Observable<void>;

  listarAusenciasBeneficiario(beneficiarioId: string): Observable<AusenciaAtendimento[]>;

  registrarJustificativa(
    ausenciaId: string,
    input: RegistrarJustificativaInput,
  ): Observable<{ id: string }>;

  avaliarJustificativa(
    justificativaId: string,
    input: AvaliarJustificativaInput,
  ): Observable<void>;
}

export const ATENDIMENTO_API =
  new InjectionToken<AtendimentoApiPort>('ATENDIMENTO_API');
