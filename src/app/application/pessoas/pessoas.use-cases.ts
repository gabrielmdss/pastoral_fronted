import { Inject, Injectable } from '@angular/core';
import { switchMap } from 'rxjs';
import { PESSOAS_API, type PessoasApiPort } from './pessoas-api.port';
import type { CriarPessoaInput, PessoaFiltro } from './pessoas.models';
@Injectable()
export class BuscarPessoasUseCase {
  constructor(@Inject(PESSOAS_API) private readonly api: PessoasApiPort) {}
  execute(f: PessoaFiltro) {
    return this.api.buscar(f);
  }
}
@Injectable()
export class CriarPessoaUseCase {
  constructor(@Inject(PESSOAS_API) private readonly api: PessoasApiPort) {}
  execute(i: CriarPessoaInput) {
    return this.api.criar(i).pipe(switchMap(({ id }) => this.api.obter(id)));
  }
}
@Injectable()
export class ObterFotoPessoaUseCase {
  constructor(@Inject(PESSOAS_API) private readonly api: PessoasApiPort) {}
  execute(id: string) {
    return this.api.obterFoto(id);
  }
}
@Injectable()
export class EnviarFotoPessoaUseCase {
  constructor(@Inject(PESSOAS_API) private readonly api: PessoasApiPort) {}
  execute(id: string, arquivo: File) {
    return this.api.enviarFoto(id, arquivo);
  }
}
