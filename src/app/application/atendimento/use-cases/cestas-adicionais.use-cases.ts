import { inject, Injectable } from '@angular/core';
import { CESTAS_ADICIONAIS_API } from '../ports/cestas-adicionais-api.port';
import type { AutorizarCestaAdicionalInput } from '../../../domain/atendimento/cesta-adicional.model';
@Injectable()
export class ListarCestasAdicionaisUseCase {
  private readonly api = inject(CESTAS_ADICIONAIS_API);
  execute(id: string) {
    return this.api.listar(id);
  }
}
@Injectable()
export class AutorizarCestaAdicionalUseCase {
  private readonly api = inject(CESTAS_ADICIONAIS_API);
  execute(id: string, input: AutorizarCestaAdicionalInput) {
    return this.api.autorizar(id, input);
  }
}
@Injectable()
export class EntregarCestaAdicionalUseCase {
  private readonly api = inject(CESTAS_ADICIONAIS_API);
  execute(id: string) {
    return this.api.entregar(id);
  }
}
