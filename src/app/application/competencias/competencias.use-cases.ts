import { Inject, Injectable } from '@angular/core';
import { COMPETENCIAS_API, CompetenciasApiPort } from './competencias-api.port';
import type { GerarCompetenciaInput } from '../../domain/competencias/competencia.model';
@Injectable()
export class ListarCompetenciasUseCase {
  constructor(@Inject(COMPETENCIAS_API) private readonly api: CompetenciasApiPort) {}
  execute() { return this.api.listar(); }
}
@Injectable()
export class ObterCompetenciaUseCase {
  constructor(@Inject(COMPETENCIAS_API) private readonly api: CompetenciasApiPort) {}
  execute(id: string) { return this.api.obter(id); }
}
@Injectable()
export class GerarCompetenciaUseCase {
  constructor(@Inject(COMPETENCIAS_API) private readonly api: CompetenciasApiPort) {}
  execute(input: GerarCompetenciaInput) { return this.api.gerar(input); }
}

