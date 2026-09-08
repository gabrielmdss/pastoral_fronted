import { describe, expect, it } from 'vitest';

import type { CheckInDto } from './atendimento-api.contracts';
import { mapAusenciasHistoricoDto, mapCheckInDto, mapRetiradaDto } from './atendimento-api.mapper';
import type { RetiradaDto } from './atendimento-api.contracts';

describe('mapCheckInDto', () => {
  it('mapeia a situação e a aptidão calculadas pelo backend', () => {
    const dto: CheckInDto = {
      id: '10',
      beneficiario: { id: '20', nomeCompleto: 'Maria Silva' },
      classificacao: 'REGULAR',
      fila: 'PRINCIPAL',
      situacaoOperacional: 'AGUARDANDO',
      podeRetirar: false,
      motivoBloqueio: 'DIREITO_NAO_DISPONIVEL',
      pendencias: [{ codigo: 'GRUPO_DIFERENTE', grupoEsperado: 'GRUPO_B' }],
      ocorridoEm: '2026-09-04T12:00:00.000Z',
    };

    expect(mapCheckInDto(dto)).toEqual(dto);
  });

  it('mapeia o contrato completo de retirada', () => {
    const dto: RetiradaDto = {
      id: '16', distribuicaoId: '3', direitoId: '31',
      beneficiario: { id: '1', nomeCompleto: 'José Carlos Oliveira' },
      tipo: 'TITULAR', status: 'VALIDA', formaIdentificacao: 'DOCUMENTO',
      representante: null, operador: { id: '4', login: 'admin' },
      ocorridoEm: '2026-09-04T14:56:37.851Z',
    };

    expect(mapRetiradaDto(dto)).toEqual(dto);
  });

  it('correlaciona ausências e justificativas pelo contrato do histórico', () => {
    expect(mapAusenciasHistoricoDto({
      beneficiario: { id: '1', nome: 'Maria' },
      eventos: [
        { tipo: 'AUSENCIA', ocorridoEm: '2026-08-01T00:00:00Z', detalhes: { ausenciaId: '8', status: 'JUSTIFICATIVA_PENDENTE', competenciaId: '7' } },
        { tipo: 'JUSTIFICATIVA', ocorridoEm: '2026-08-02T00:00:00Z', detalhes: { justificativaId: '9', ausenciaId: '8', decisao: 'PENDENTE', momento: 'DEPOIS_DISTRIBUICAO' } },
      ],
    })[0]).toMatchObject({ id: '8', status: 'JUSTIFICATIVA_PENDENTE', justificativas: [{ id: '9', decisao: 'PENDENTE' }] });
  });
});
