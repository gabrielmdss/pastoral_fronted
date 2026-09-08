import type { CheckIn } from '../../../domain/atendimento/check-in.model';
import type { CheckInDto } from './atendimento-api.contracts';
import type { Retirada } from '../../../domain/atendimento/retirada.model';
import type { RetiradaDto } from './atendimento-api.contracts';
import type { HistoricoBeneficiarioDto } from './atendimento-api.contracts';
import type { AusenciaAtendimento, DecisaoJustificativa, MomentoJustificativa } from '../../../domain/atendimento/justificativa.model';

export function mapCheckInDto(dto: CheckInDto): CheckIn {
  return {
    id: dto.id,

    beneficiario: {
      id: dto.beneficiario.id,
      nomeCompleto: dto.beneficiario.nomeCompleto,
    },

    classificacao: dto.classificacao,

    fila: dto.fila,
    situacaoOperacional: dto.situacaoOperacional,
    podeRetirar: dto.podeRetirar,
    motivoBloqueio: dto.motivoBloqueio,

    pendencias: dto.pendencias.map((pendencia) => ({
      codigo: pendencia.codigo,
      grupoEsperado: pendencia.grupoEsperado,
      competencia: pendencia.competencia,
    })),

    ocorridoEm: dto.ocorridoEm,
  };
}

export function mapAusenciasHistoricoDto(dto: HistoricoBeneficiarioDto): AusenciaAtendimento[] {
  const justificativas = dto.eventos
    .filter((evento) => evento.tipo === 'JUSTIFICATIVA')
    .map((evento) => ({
      id: String(evento.detalhes['justificativaId'] ?? ''),
      ausenciaId: String(evento.detalhes['ausenciaId'] ?? ''),
      decisao: String(evento.detalhes['decisao']) as DecisaoJustificativa,
      momento: String(evento.detalhes['momento']) as MomentoJustificativa,
      ocorridoEm: evento.ocorridoEm,
    }));

  return dto.eventos
    .filter((evento) => evento.tipo === 'AUSENCIA')
    .map((evento) => {
      const id = String(evento.detalhes['ausenciaId'] ?? '');
      return {
        id,
        status: String(evento.detalhes['status'] ?? ''),
        competenciaId: String(evento.detalhes['competenciaId'] ?? ''),
        ocorridoEm: evento.ocorridoEm,
        justificativas: justificativas.filter((item) => item.ausenciaId === id),
      };
    });
}

export function mapRetiradaDto(dto: RetiradaDto): Retirada {
  return {
    id: dto.id,
    distribuicaoId: dto.distribuicaoId,
    direitoId: dto.direitoId,
    beneficiario: { ...dto.beneficiario },
    tipo: dto.tipo,
    status: dto.status,
    formaIdentificacao: dto.formaIdentificacao,
    representante: dto.representante ? { ...dto.representante } : null,
    operador: { ...dto.operador },
    ocorridoEm: dto.ocorridoEm,
  };
}
