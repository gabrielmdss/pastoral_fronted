import { inject, Injectable } from '@angular/core';
import { LIBERACOES_API } from './liberacoes-api.port';
import type { LiberarCestasInput } from '../../domain/liberacoes/liberacao.model';
@Injectable()
export class ListarLiberacoesUseCase {
  private readonly api = inject(LIBERACOES_API);
  execute(id: string) {
    return this.api.listar(id);
  }
}
@Injectable()
export class LiberarCestasUseCase {
  private readonly api = inject(LIBERACOES_API);
  execute(id: string, input: LiberarCestasInput) {
    return this.api.liberar(id, input);
  }
}
