import { inject, Injectable } from '@angular/core';
import { INVENTARIOS_API } from './inventarios-api.port';
@Injectable()
export class CriarInventarioUseCase {
  private readonly api = inject(INVENTARIOS_API);
  execute() {
    return this.api.criar();
  }
}
@Injectable()
export class ObterInventarioUseCase {
  private readonly api = inject(INVENTARIOS_API);
  execute(id: string) {
    return this.api.obter(id);
  }
}
@Injectable()
export class ContarInventarioUseCase {
  private readonly api = inject(INVENTARIOS_API);
  execute(id: string, apresentacaoId: string, saldoFisico: number) {
    return this.api.contar(id, apresentacaoId, saldoFisico);
  }
}
@Injectable()
export class ConcluirInventarioUseCase {
  private readonly api = inject(INVENTARIOS_API);
  execute(id: string) {
    return this.api.concluir(id);
  }
}
