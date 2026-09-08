import { Distribuicao } from '../../../domain/distribuicoes/distribuicao.model';
import { DistribuicaoDto } from './distribuicoes-api.contracts';

export function mapDistribuicaoDto(
  dto: DistribuicaoDto,
): Distribuicao {
  return {
    id: dto.id,
    status: dto.status,
    dataPrevista: dto.dataPrevista,
    dataReal: dto.dataReal,

    competencia: {
      id: dto.competencia.id,
      ano: dto.competencia.ano,
      mes: dto.competencia.mes,
    },

    grupo: {
      id: dto.grupo.id,
      codigo: dto.grupo.codigo,
      nome: dto.grupo.nome,
    },

    previstos: dto.previstos,

    checkIns: dto.checkIns,
    regularesPresentes: dto.regularesPresentes,
    pendentesPresentes: dto.pendentesPresentes,

    retiradas: dto.retiradas,
    ausentes: dto.ausentes,
    naoAtendidosEstoque: dto.naoAtendidosEstoque,
    naoAtendidosIrregularidade:
      dto.naoAtendidosIrregularidade,

    cestasLiberadas: dto.cestasLiberadas,
    cestasConsumidas: dto.cestasConsumidas,
    cestasRetornadas: dto.cestasRetornadas,
    cestasDisponiveis: dto.cestasDisponiveis,
  };
}