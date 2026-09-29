export interface PerfilDto {
  id: string;
  codigo: string;
  nome: string;
}
export interface CriarUsuarioDto {
  login: string;
  senha: string;
  perfilIds: string[];
}
export interface UsuarioCriadoDto {
  id: string;
  login: string;
  perfis: string[];
}
