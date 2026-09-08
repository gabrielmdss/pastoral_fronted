import { Inject, Injectable } from '@angular/core';
import { ATENDIMENTO_API, type AtendimentoApiPort } from '../atendimento-api.port';

@Injectable()
export class ListarAusenciasBeneficiarioUseCase {
  constructor(@Inject(ATENDIMENTO_API) private readonly api: AtendimentoApiPort) {}
  execute(beneficiarioId: string) {
    return this.api.listarAusenciasBeneficiario(beneficiarioId);
  }
}
