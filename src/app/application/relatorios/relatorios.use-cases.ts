import { inject, Injectable } from '@angular/core';
import { RELATORIOS_API } from './relatorios-api.port';
import type {
  FiltroDistribuicoes,
  FiltroBeneficiarios,
  FiltroEstoque,
} from '../../domain/relatorios/relatorios.model';
@Injectable()
export class RelatorioDistribuicoesUseCase {
  private readonly api = inject(RELATORIOS_API);
  execute(f: FiltroDistribuicoes) {
    return this.api.distribuicoes(f);
  }
}
@Injectable()
export class RelatorioBeneficiariosUseCase {
  private readonly api = inject(RELATORIOS_API);
  execute(f: FiltroBeneficiarios) {
    return this.api.beneficiarios(f);
  }
}
@Injectable()
export class RelatorioEstoqueUseCase {
  private readonly api = inject(RELATORIOS_API);
  execute(f: FiltroEstoque) {
    return this.api.estoque(f);
  }
}
