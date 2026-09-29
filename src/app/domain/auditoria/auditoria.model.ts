export interface AuditoriaUsuario {
  id: string;
  login: string;
}
export interface AuditoriaFiltro {
  page: number;
  limit: number;
  usuarioId?: string;
  entidade?: string;
  entidadeId?: string;
  operacao?: string;
  dataInicio?: string;
  dataFim?: string;
}
export interface RegistroAuditoria {
  id: string;
  usuario: AuditoriaUsuario | null;
  entidade: string;
  entidadeId: string | null;
  operacao: string;
  motivo: string | null;
  ocorridoEm: string;
  possuiEstadoAnterior: boolean;
  possuiEstadoNovo: boolean;
}
export interface RegistroAuditoriaDetalhe {
  id: string;
  usuario: AuditoriaUsuario | null;
  entidade: string;
  entidadeId: string | null;
  operacao: string;
  motivo: string | null;
  ocorridoEm: string;
  estadoAnterior: unknown;
  estadoNovo: unknown;
}
export interface PaginaAuditoria {
  data: RegistroAuditoria[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
