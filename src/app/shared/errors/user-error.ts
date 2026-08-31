import { HttpErrorResponse } from '@angular/common/http';
const messages: Record<string, string> = {
  CREDENCIAIS_INVALIDAS: 'Login ou senha inválidos.', AUTH_INVALIDA: 'Login ou senha inválidos.',
  PERMISSAO_NEGADA: 'Você não possui permissão para realizar esta ação.', USUARIO_INATIVO: 'Este usuário está inativo.',
};
export function userErrorMessage(error: unknown, fallback = 'Não foi possível concluir. Tente novamente.'): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;
  const body: unknown = error.error;
  const code = typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'object' && body.error !== null && 'code' in body.error ? String(body.error.code) : '';
  if (messages[code]) return messages[code];
  if (error.status === 401) return 'Login ou senha inválidos.';
  if (error.status === 403) return messages['PERMISSAO_NEGADA']!;
  if (error.status === 400 || error.status === 422) return 'Verifique os dados informados.';
  if (error.status === 409) return 'A operação não pôde ser concluída devido ao estado atual.';
  return fallback;
}
