import { Inject, Injectable } from '@angular/core';
import { AUDITORIA_API, AuditoriaApiPort } from './auditoria-api.port';
import type { AuditoriaFiltro } from '../../domain/auditoria/auditoria.model';
@Injectable()
export class ListarAuditoriaUseCase {
  constructor(@Inject(AUDITORIA_API) private readonly api: AuditoriaApiPort) {}
  execute(filtro: AuditoriaFiltro) {
    return this.api.listar(filtro);
  }
}
@Injectable()
export class ObterAuditoriaUseCase {
  constructor(@Inject(AUDITORIA_API) private readonly api: AuditoriaApiPort) {}
  execute(id: string) {
    return this.api.obter(id);
  }
}
