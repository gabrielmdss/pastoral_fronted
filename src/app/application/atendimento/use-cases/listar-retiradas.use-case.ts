import { Inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import type { Retirada } from '../../../domain/atendimento/retirada.model';
import {
  ATENDIMENTO_API,
  type AtendimentoApiPort,
} from '../atendimento-api.port';

@Injectable()
export class ListarRetiradasUseCase {
  constructor(
    @Inject(ATENDIMENTO_API)
    private readonly api: AtendimentoApiPort,
  ) {}

  execute(distribuicaoId: string): Observable<Retirada[]> {
    return this.api.listarRetiradas(distribuicaoId);
  }
}
