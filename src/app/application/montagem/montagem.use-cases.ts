import { inject, Injectable } from '@angular/core';
import { MONTAGEM_API } from './montagem-api.port';
import type {
  MontarLoteInput,
  AjustarLoteInput,
  DesmontarLoteInput,
} from '../../domain/montagem/montagem.model';
@Injectable()
export class ListarLotesUseCase {
  private readonly api = inject(MONTAGEM_API);
  execute() {
    return this.api.listar();
  }
}
@Injectable()
export class ObterLoteUseCase {
  private readonly api = inject(MONTAGEM_API);
  execute(id: string) {
    return this.api.obter(id);
  }
}
@Injectable()
export class MontarLoteUseCase {
  private readonly api = inject(MONTAGEM_API);
  execute(input: MontarLoteInput) {
    return this.api.montar(input);
  }
}
@Injectable()
export class AjustarLoteUseCase {
  private readonly api = inject(MONTAGEM_API);
  execute(id: string, input: AjustarLoteInput) {
    return this.api.ajustar(id, input);
  }
}
@Injectable()
export class DesmontarLoteUseCase {
  private readonly api = inject(MONTAGEM_API);
  execute(id: string, input: DesmontarLoteInput) {
    return this.api.desmontar(id, input);
  }
}
