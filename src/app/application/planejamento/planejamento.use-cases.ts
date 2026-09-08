import { Inject, Injectable } from '@angular/core';
import { PLANEJAMENTO_API, PlanejamentoApiPort } from './planejamento-api.port';
import type {
  PlanejamentoInput,
  RevisaoPlanejamentoInput,
} from '../../domain/planejamento/planejamento.model';
@Injectable()
export class ListarPlanejamentosUseCase {
  constructor(@Inject(PLANEJAMENTO_API) private api: PlanejamentoApiPort) {}
  execute() {
    return this.api.listar();
  }
}
@Injectable()
export class ObterPlanejamentoUseCase {
  constructor(@Inject(PLANEJAMENTO_API) private api: PlanejamentoApiPort) {}
  execute(id: string) {
    return this.api.obter(id);
  }
}
@Injectable()
export class SimularPlanejamentoUseCase {
  constructor(@Inject(PLANEJAMENTO_API) private api: PlanejamentoApiPort) {}
  execute(input: PlanejamentoInput) {
    return this.api.simular(input);
  }
}
@Injectable()
export class CriarPlanejamentoUseCase {
  constructor(@Inject(PLANEJAMENTO_API) private api: PlanejamentoApiPort) {}
  execute(input: PlanejamentoInput) {
    return this.api.criar(input);
  }
}
@Injectable()
export class RevisarPlanejamentoUseCase {
  constructor(@Inject(PLANEJAMENTO_API) private api: PlanejamentoApiPort) {}
  execute(id: string, input: RevisaoPlanejamentoInput) {
    return this.api.revisar(id, input);
  }
}
@Injectable()
export class AprovarPlanejamentoUseCase {
  constructor(@Inject(PLANEJAMENTO_API) private api: PlanejamentoApiPort) {}
  execute(id: string) {
    return this.api.aprovar(id);
  }
}
