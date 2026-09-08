import { Inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import type { CheckIn } from '../../../domain/atendimento/check-in.model';

import {
  ATENDIMENTO_API,
  type AtendimentoApiPort,
} from '../atendimento-api.port';

@Injectable()
export class RegistrarCheckInUseCase {
  constructor(
    @Inject(ATENDIMENTO_API)
    private readonly api: AtendimentoApiPort,
  ) {}

  execute(
    distribuicaoId: string,
    beneficiarioId: string,
  ): Observable<CheckIn> {
    return this.api.registrarCheckIn(
      distribuicaoId,
      beneficiarioId,
    );
  }
}