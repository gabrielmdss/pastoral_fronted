import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { userErrorMessage } from './user-error';
describe('domain error mapping', () => {
  it.each([
    ['SEM_VAGA', 'Não há vaga disponível no momento.'],
    ['BENEFICIARIO_NAO_ENCONTRADO', 'Beneficiário não encontrado.'],
    ['CANDIDATURA_INATIVA', 'Esta candidatura não está ativa.'],
    ['PERMISSAO_NEGADA', 'Você não possui permissão para realizar esta ação.'],
    ['REGULARES_AGUARDANDO', 'Aguarde o atendimento dos beneficiários regulares.'],
    ['DIREITO_NAO_DISPONIVEL', 'O direito está previsto para outra distribuição.'],
    ['SEM_CESTA_DISPONIVEL', 'Não há cesta disponível para esta retirada.'],
    ['REPRESENTANTE_INVALIDO', 'Informe o representante e confirme a autorização.'],
    ['RETIRADA_JA_ESTORNADA', 'Esta retirada já foi estornada.'],
    ['ESTORNO_NAO_AUTORIZADO', 'Você não possui permissão para estornar esta retirada.'],
    ['DISTRIBUICAO_NAO_ENCONTRADA', 'Distribuição não encontrada.'],
    ['DISTRIBUICAO_ENCERRADA', 'Esta distribuição já foi encerrada.'],
    ['DISTRIBUICAO_NAO_ABERTA', 'A distribuição precisa estar aberta para esta operação.'],
    ['ENCERRAMENTO_INVALIDO', 'Não foi possível encerrar: verifique as pendências operacionais.'],
  ])('mapeia %s', (code, message) =>
    expect(
      userErrorMessage(new HttpErrorResponse({ status: 409, error: { error: { code } } })),
    ).toBe(message),
  );
});
