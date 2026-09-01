import { Inject, Injectable } from '@angular/core';
import { CANDIDATURAS_API, type CandidaturasApiPort } from './candidaturas-api.port';
import type {
  AdmitirCandidaturaInput,
  CandidaturaFiltro,
  ContatoInput,
} from './candidaturas.models';
@Injectable()
export class ListarCandidaturasUseCase {
  constructor(@Inject(CANDIDATURAS_API) private readonly api: CandidaturasApiPort) {}
  execute(f: CandidaturaFiltro) {
    return this.api.listar(f);
  }
}
@Injectable()
export class CriarCandidaturaUseCase {
  constructor(@Inject(CANDIDATURAS_API) private readonly api: CandidaturasApiPort) {}
  execute(pessoaId: string) {
    return this.api.criar(pessoaId);
  }
}
@Injectable()
export class PriorizarCandidaturaUseCase {
  constructor(@Inject(CANDIDATURAS_API) private readonly api: CandidaturasApiPort) {}
  execute(id: string, j: string) {
    return this.api.priorizar(id, j);
  }
}
@Injectable()
export class RegistrarContatoUseCase {
  constructor(@Inject(CANDIDATURAS_API) private readonly api: CandidaturasApiPort) {}
  execute(id: string, i: ContatoInput) {
    return this.api.registrarContato(id, i);
  }
}
@Injectable()
export class MarcarNaoLocalizadoUseCase {
  constructor(@Inject(CANDIDATURAS_API) private readonly api: CandidaturasApiPort) {}
  execute(id: string) {
    return this.api.marcarNaoLocalizado(id);
  }
}
@Injectable()
export class AdmitirCandidaturaUseCase {
  constructor(@Inject(CANDIDATURAS_API) private readonly api: CandidaturasApiPort) {}
  execute(id: string, i: AdmitirCandidaturaInput) {
    return this.api.admitir(id, i);
  }
}
