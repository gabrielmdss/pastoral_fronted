export interface AuditoriaUsuarioDto {
  id: string;
  login: string;
}
export interface RegistroAuditoriaDto {
  id: string;
  usuario: AuditoriaUsuarioDto | null;
  entidade: string;
  entidadeId: string | null;
  operacao: string;
  motivo: string | null;
  ocorridoEm: string;
  possuiEstadoAnterior: boolean;
  possuiEstadoNovo: boolean;
}
export interface RegistroAuditoriaDetalheDto {
  id: string;
  usuario: AuditoriaUsuarioDto | null;
  entidade: string;
  entidadeId: string | null;
  operacao: string;
  motivo: string | null;
  ocorridoEm: string;
  estadoAnterior: unknown;
  estadoNovo: unknown;
}
export interface PaginaAuditoriaDto {
  data: RegistroAuditoriaDto[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
