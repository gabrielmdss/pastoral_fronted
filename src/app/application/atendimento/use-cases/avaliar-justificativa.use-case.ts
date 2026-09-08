import { Inject, Injectable } from '@angular/core';
import { ATENDIMENTO_API, type AtendimentoApiPort } from '../atendimento-api.port';
import type { AvaliarJustificativaInput } from '../../../domain/atendimento/justificativa.model';

@Injectable()
export class AvaliarJustificativaUseCase {
  constructor(@Inject(ATENDIMENTO_API) private readonly api: AtendimentoApiPort) {}
  execute(justificativaId: string, input: AvaliarJustificativaInput) {
    return this.api.avaliarJustificativa(justificativaId, input);
  }
}
