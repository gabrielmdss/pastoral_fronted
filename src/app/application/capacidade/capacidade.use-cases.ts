import { Inject, Injectable } from '@angular/core';
import { CAPACIDADE_API, type CapacidadeApiPort } from './capacidade-api.port';
import type { AlterarCapacidadeInput } from './capacidade.model';
@Injectable()
export class ObterCapacidadeUseCase {
  constructor(@Inject(CAPACIDADE_API) private readonly api: CapacidadeApiPort) {}
  execute() {
    return this.api.obter();
  }
}
@Injectable()
export class AlterarCapacidadeUseCase {
  constructor(@Inject(CAPACIDADE_API) private readonly api: CapacidadeApiPort) {}
  execute(i: AlterarCapacidadeInput) {
    return this.api.alterar(i);
  }
}
