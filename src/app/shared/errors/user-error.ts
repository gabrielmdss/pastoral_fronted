import { HttpErrorResponse } from '@angular/common/http';
const messages: Record<string, string> = {
  CREDENCIAIS_INVALIDAS: 'Login ou senha inválidos.',
  AUTH_INVALIDA: 'Login ou senha inválidos.',
  PERMISSAO_NEGADA: 'Você não possui permissão para realizar esta ação.',
  USUARIO_INATIVO: 'Este usuário está inativo.',
  SEM_VAGA: 'Não há vaga disponível no momento.',
  CAPACIDADE_EXCEDIDA: 'A capacidade disponível foi excedida.',
  PESSOA_JA_BENEFICIARIA: 'Esta pessoa já é beneficiária.',
  BENEFICIARIO_JA_ATIVO: 'Esta pessoa já é beneficiária ativa.',
  BENEFICIARIO_JA_CADASTRADO: 'Esta pessoa já possui cadastro de beneficiário.',
  BENEFICIARIO_DESLIGADO: 'Este beneficiário está desligado.',
  BENEFICIARIO_INATIVO: 'Este beneficiário está desligado.',
  BENEFICIARIO_NAO_ENCONTRADO: 'Beneficiário não encontrado.',
  CANDIDATURA_INVALIDA: 'Esta candidatura não pode ser alterada.',
  CANDIDATURA_INATIVA: 'Esta candidatura não está ativa.',
  CANDIDATURA_NAO_ADMISSIVEL: 'Esta candidatura não pode ser admitida.',
  CANDIDATURA_NAO_ENCONTRADA: 'Candidatura não encontrada.',
  CANDIDATURA_ATIVA_EXISTENTE: 'Já existe uma candidatura ativa para esta pessoa.',
  DOCUMENTO_DUPLICADO: 'Já existe uma pessoa com este documento.',
  TIPO_DOCUMENTO_INVALIDO: 'Selecione um tipo de documento válido.',
  PESSOA_NAO_ENCONTRADA: 'Pessoa não encontrada.',
  GRUPO_NAO_ENCONTRADO: 'Grupo não encontrado.',
  MOTIVO_NAO_ENCONTRADO: 'Motivo de desligamento não encontrado.',
  JUSTIFICATIVA_OBRIGATORIA: 'Informe uma justificativa válida.',
};
export function userErrorMessage(
  error: unknown,
  fallback = 'Não foi possível concluir. Tente novamente.',
): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;
  const body: unknown = error.error;
  const code =
    typeof body === 'object' &&
    body !== null &&
    'error' in body &&
    typeof body.error === 'object' &&
    body.error !== null &&
    'code' in body.error
      ? String(body.error.code)
      : '';
  if (messages[code]) return messages[code];
  if (error.status === 401) return 'Login ou senha inválidos.';
  if (error.status === 403) return messages['PERMISSAO_NEGADA']!;
  if (error.status === 400 || error.status === 422) return 'Verifique os dados informados.';
  if (error.status === 409) return 'A operação não pôde ser concluída devido ao estado atual.';
  return fallback;
}
