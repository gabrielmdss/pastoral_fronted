import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { userErrorMessage } from './user-error';
describe('domain error mapping', () => {
  it.each([
    ['SEM_VAGA', 'Não há vaga disponível no momento.'],
    ['BENEFICIARIO_NAO_ENCONTRADO', 'Beneficiário não encontrado.'],
    ['CANDIDATURA_INATIVA', 'Esta candidatura não está ativa.'],
    ['PERMISSAO_NEGADA', 'Você não possui permissão para realizar esta ação.'],
  ])('mapeia %s', (code, message) =>
    expect(
      userErrorMessage(new HttpErrorResponse({ status: 409, error: { error: { code } } })),
    ).toBe(message),
  );
});
