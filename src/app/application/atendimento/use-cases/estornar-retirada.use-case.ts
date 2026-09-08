import { Inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import {
  ATENDIMENTO_API,
  type AtendimentoApiPort,
} from '../atendimento-api.port';

@Injectable()
export class EstornarRetiradaUseCase {
  constructor(
    @Inject(ATENDIMENTO_API)
    private readonly api: AtendimentoApiPort,
  ) {}

  execute(retiradaId: string, motivo: string): Observable<void> {
    return this.api.estornarRetirada(retiradaId, motivo.trim());
  }
}
