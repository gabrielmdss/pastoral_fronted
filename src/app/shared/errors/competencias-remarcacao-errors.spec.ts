import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { userErrorMessage } from './user-error';
describe('erros de competências e remarcação', () => {
  it.each([
    [404, 'COMPETENCIA_NAO_ENCONTRADA', 'Competência não encontrada.'],
    [404, 'DISTRIBUICAO_NAO_ENCONTRADA', 'Distribuição não encontrada.'],
    [409, 'DISTRIBUICAO_NAO_REMARCAVEL', 'Esta distribuição não pode ser remarcada no status atual. Atualize a consulta.'],
    [400, 'VALIDACAO_INVALIDA', 'Verifique os dados informados.'],
    [403, 'PERMISSAO_NEGADA', 'Você não possui permissão para realizar esta ação.'],
    [409, 'REGISTRO_DUPLICADO', 'Já existe um registro com os dados informados.'],
    [409, 'REFERENCIA_INVALIDA', 'Um registro relacionado não está disponível. Atualize a consulta.'],
    [409, 'REGRA_DE_INTEGRIDADE', 'Os dados não atendem às regras permitidas pelo servidor.'],
    [409, 'CONCORRENCIA_REPETIR', 'Os dados foram alterados por outra operação. Tente novamente.'],
    [409, 'RECURSO_OCUPADO', 'O registro está ocupado. Tente novamente em instantes.'],
  ])('traduz %s / %s', (status, code, message) => {
    expect(userErrorMessage(new HttpErrorResponse({ status: Number(status), error: { error: { code } } }))).toBe(message);
  });
  it('não expõe mensagem interna do servidor', () => {
    expect(userErrorMessage(new HttpErrorResponse({ status: 500, error: { error: { code: 'ERRO_INTERNO', message: 'SQL interno' } } }), 'Não foi possível gerar a competência.')).toBe('Não foi possível gerar a competência.');
  });
});
