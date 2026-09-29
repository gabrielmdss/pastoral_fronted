import { Inject, Injectable } from '@angular/core';
import { USUARIOS_API, UsuariosApiPort } from './usuarios-api.port';
import type { NovoUsuario } from '../../domain/usuarios/usuario.model';
@Injectable()
export class ListarPerfisUseCase {
  constructor(@Inject(USUARIOS_API) private readonly api: UsuariosApiPort) {}
  execute() {
    return this.api.listarPerfis();
  }
}
@Injectable()
export class CriarUsuarioUseCase {
  constructor(@Inject(USUARIOS_API) private readonly api: UsuariosApiPort) {}
  execute(input: NovoUsuario) {
    return this.api.criar(input);
  }
}
