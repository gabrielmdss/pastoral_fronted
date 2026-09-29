import { Inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import {
  ATENDIMENTO_API,
  type AtendimentoApiPort,
} from '../atendimento-api.port';
import type {
  RegistrarRetiradaInput,
  RetiradaRepresentanteInput,
} from '../../../domain/atendimento/retirada.model';

@Injectable()
export class RegistrarRetiradaUseCase {
  constructor(
    @Inject(ATENDIMENTO_API)
    private readonly api: AtendimentoApiPort,
  ) {}

  execute(
    distribuicaoId: string,
    beneficiarioId: string,
    representante?: RetiradaRepresentanteInput,
  ): Observable<{ id: string }> {
    return this.api.registrarRetirada(distribuicaoId, {
      beneficiarioId,
      tipo: representante ? 'REPRESENTANTE' : 'TITULAR',
      formaIdentificacao: representante ? 'REPRESENTANTE' : 'DOCUMENTO',
      representante: representante ?? null,
      justificativaExcecao: null,
    });
  }

  /**
   * Registro completo (tipos de exceção). As regras de tipo, forma,
   * justificativa e permissão são validadas pelo backend.
   */
  registrar(distribuicaoId: string, input: RegistrarRetiradaInput): Observable<{ id: string }> {
    return this.api.registrarRetirada(distribuicaoId, input);
  }
}
