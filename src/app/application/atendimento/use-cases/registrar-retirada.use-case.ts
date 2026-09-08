import { Inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import {
  ATENDIMENTO_API,
  type AtendimentoApiPort,
} from '../atendimento-api.port';
import type { RetiradaRepresentanteInput } from '../../../domain/atendimento/retirada.model';

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
}
