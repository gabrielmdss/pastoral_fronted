export interface AuthenticatedUser {
  id: string;
  login: string;
  ativo: boolean;
  perfis: string[];
  permissoes: string[];
}
