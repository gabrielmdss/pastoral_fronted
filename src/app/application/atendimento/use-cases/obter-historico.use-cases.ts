import { Inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import { ATENDIMENTO_API, type AtendimentoApiPort } from '../atendimento-api.port';
import type {
  HistoricoBeneficiario,
  HistoricoDistribuicao,
} from '../../../domain/atendimento/historico.model';

// providedIn root: avoids touching main/providers.ts; ATENDIMENTO_API is an app-level provider.
@Injectable({ providedIn: 'root' })
export class ObterHistoricoBeneficiarioUseCase {
  constructor(@Inject(ATENDIMENTO_API) private readonly api: AtendimentoApiPort) {}
  execute(beneficiarioId: string): Observable<HistoricoBeneficiario> {
    return this.api.obterHistoricoBeneficiario(beneficiarioId);
  }
}

@Injectable({ providedIn: 'root' })
export class ObterHistoricoDistribuicaoUseCase {
  constructor(@Inject(ATENDIMENTO_API) private readonly api: AtendimentoApiPort) {}
  execute(distribuicaoId: string): Observable<HistoricoDistribuicao> {
    return this.api.obterHistoricoDistribuicao(distribuicaoId);
  }
}
