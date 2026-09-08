import { Inject, Injectable } from '@angular/core';
import { MODELOS_API, ModelosApiPort } from './modelos-api.port';
import type { ModeloInput, VersaoModeloInput } from '../../domain/cestas/modelo-cesta.model';
@Injectable()
export class ListarModelosUseCase {
  constructor(@Inject(MODELOS_API) private api: ModelosApiPort) {}
  execute() {
    return this.api.listar();
  }
}
@Injectable()
export class ObterModeloUseCase {
  constructor(@Inject(MODELOS_API) private api: ModelosApiPort) {}
  execute(id: string) {
    return this.api.obter(id);
  }
}
@Injectable()
export class CriarModeloUseCase {
  constructor(@Inject(MODELOS_API) private api: ModelosApiPort) {}
  execute(input: ModeloInput) {
    return this.api.criar(input);
  }
}
@Injectable()
export class CriarVersaoModeloUseCase {
  constructor(@Inject(MODELOS_API) private api: ModelosApiPort) {}
  execute(id: string, input: VersaoModeloInput) {
    return this.api.versao(id, input);
  }
}
