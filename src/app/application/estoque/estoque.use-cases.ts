import { Inject, Injectable } from '@angular/core';
import { ESTOQUE_API, EstoqueApiPort } from './estoque-api.port';
import type {
  InsumoInput,
  DoadorInput,
  EntradaInput,
  PerdaInput,
} from '../../domain/estoque/estoque.model';
@Injectable()
export class ListarInsumosUseCase {
  constructor(@Inject(ESTOQUE_API) private readonly api: EstoqueApiPort) {}
  execute() {
    return this.api.listar();
  }
}
@Injectable()
export class ObterInsumoUseCase {
  constructor(@Inject(ESTOQUE_API) private readonly api: EstoqueApiPort) {}
  execute(id: string) {
    return this.api.obter(id);
  }
}
@Injectable()
export class ListarCategoriasInsumoUseCase {
  constructor(@Inject(ESTOQUE_API) private readonly api: EstoqueApiPort) {}
  execute() {
    return this.api.categorias();
  }
}
@Injectable()
export class CadastrarInsumoUseCase {
  constructor(@Inject(ESTOQUE_API) private readonly api: EstoqueApiPort) {}
  execute(input: InsumoInput) {
    return this.api.cadastrar(input);
  }
}
@Injectable()
export class ListarDoadoresUseCase {
  constructor(@Inject(ESTOQUE_API) private readonly api: EstoqueApiPort) {}
  execute() {
    return this.api.doadores();
  }
}
@Injectable()
export class CriarDoadorUseCase {
  constructor(@Inject(ESTOQUE_API) private readonly api: EstoqueApiPort) {}
  execute(input: DoadorInput) {
    return this.api.criarDoador(input);
  }
}
@Injectable()
export class AtualizarDoadorUseCase {
  constructor(@Inject(ESTOQUE_API) private readonly api: EstoqueApiPort) {}
  execute(id: string, input: DoadorInput & { ativo: boolean }) {
    return this.api.atualizarDoador(id, input);
  }
}
@Injectable()
export class RegistrarEntradaUseCase {
  constructor(@Inject(ESTOQUE_API) private readonly api: EstoqueApiPort) {}
  execute(input: EntradaInput) {
    return this.api.entrada(input);
  }
}
@Injectable()
export class RegistrarPerdaUseCase {
  constructor(@Inject(ESTOQUE_API) private readonly api: EstoqueApiPort) {}
  execute(input: PerdaInput) {
    return this.api.perda(input);
  }
}
