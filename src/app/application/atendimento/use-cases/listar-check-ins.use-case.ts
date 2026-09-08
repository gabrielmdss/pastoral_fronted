import { Inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import {
  ATENDIMENTO_API,
  type AtendimentoApiPort,
} from '../atendimento-api.port';

import type {
  CheckIn,
  CheckInClassificacao,
  CheckInSituacaoOperacional,
} from '../../../domain/atendimento/check-in.model';

@Injectable()
export class ListarCheckInsUseCase {
  constructor(
    @Inject(ATENDIMENTO_API)
    private readonly api: AtendimentoApiPort,
  ) {}

  execute(
    distribuicaoId: string,
    classificacao?: CheckInClassificacao,
    situacao?: CheckInSituacaoOperacional,
  ): Observable<CheckIn[]> {
    return this.api.listarCheckIns(
      distribuicaoId,
      classificacao,
      situacao,
    );
  }
}
