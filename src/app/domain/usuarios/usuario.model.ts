export interface Perfil {
  id: string;
  codigo: string;
  nome: string;
}
export interface NovoUsuario {
  login: string;
  senha: string;
  perfilIds: string[];
}
export interface UsuarioCriado {
  id: string;
  login: string;
  perfis: string[];
}
