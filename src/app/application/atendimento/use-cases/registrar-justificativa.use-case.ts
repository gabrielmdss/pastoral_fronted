import { Inject, Injectable } from '@angular/core';
import { ATENDIMENTO_API, type AtendimentoApiPort } from '../atendimento-api.port';
import type { RegistrarJustificativaInput } from '../../../domain/atendimento/justificativa.model';

@Injectable()
export class RegistrarJustificativaUseCase {
  constructor(@Inject(ATENDIMENTO_API) private readonly api: AtendimentoApiPort) {}
  execute(ausenciaId: string, input: RegistrarJustificativaInput) {
    return this.api.registrarJustificativa(ausenciaId, input);
  }
}
