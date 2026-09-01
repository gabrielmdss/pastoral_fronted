import { Inject, Injectable } from '@angular/core';
import { CATALOGOS_API, type CatalogosApiPort } from './catalogos-api.port';
@Injectable()
export class ListarGruposUseCase {
  constructor(@Inject(CATALOGOS_API) private readonly api: CatalogosApiPort) {}
  execute() {
    return this.api.grupos();
  }
}
@Injectable()
export class ListarMotivosUseCase {
  constructor(@Inject(CATALOGOS_API) private readonly api: CatalogosApiPort) {}
  execute() {
    return this.api.motivos();
  }
}
