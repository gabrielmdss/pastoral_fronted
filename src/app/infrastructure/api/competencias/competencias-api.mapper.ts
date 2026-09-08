import type { Competencia } from '../../../domain/competencias/competencia.model';
import type { CompetenciaDto } from './competencias-api.contracts';
export function mapCompetenciaDto(dto: CompetenciaDto): Competencia {
  return { id: dto.id, ano: dto.ano, mes: dto.mes, status: dto.status, distribuicoes: dto.distribuicoes, direitos: dto.direitos };
}

