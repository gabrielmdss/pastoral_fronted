import { Inject, Injectable } from '@angular/core';
import { DISTRIBUICOES_API, DistribuicoesApiPort } from './distribuicoes-api.port';
import type { RemarcarDistribuicaoInput } from '../../domain/distribuicoes/distribuicao.model';
@Injectable()
export class RemarcarDistribuicaoUseCase {
  constructor(@Inject(DISTRIBUICOES_API) private readonly api: DistribuicoesApiPort) {}
  execute(id: string, input: RemarcarDistribuicaoInput) { return this.api.remarcar(id, input); }
}
