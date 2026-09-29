import type {
  AuditoriaUsuario,
  PaginaAuditoria,
  RegistroAuditoria,
  RegistroAuditoriaDetalhe,
} from '../../../domain/auditoria/auditoria.model';
import type {
  AuditoriaUsuarioDto,
  PaginaAuditoriaDto,
  RegistroAuditoriaDetalheDto,
  RegistroAuditoriaDto,
} from './auditoria-api.contracts';
function mapUsuario(dto: AuditoriaUsuarioDto | null): AuditoriaUsuario | null {
  return dto ? { id: String(dto.id), login: dto.login } : null;
}
export function mapRegistroAuditoria(dto: RegistroAuditoriaDto): RegistroAuditoria {
  return {
    id: String(dto.id),
    usuario: mapUsuario(dto.usuario),
    entidade: dto.entidade,
    entidadeId: dto.entidadeId ?? null,
    operacao: dto.operacao,
    motivo: dto.motivo ?? null,
    ocorridoEm: dto.ocorridoEm,
    possuiEstadoAnterior: !!dto.possuiEstadoAnterior,
    possuiEstadoNovo: !!dto.possuiEstadoNovo,
  };
}
export function mapPaginaAuditoria(dto: PaginaAuditoriaDto): PaginaAuditoria {
  return { data: dto.data.map(mapRegistroAuditoria), meta: { ...dto.meta } };
}
export function mapRegistroAuditoriaDetalhe(
  dto: RegistroAuditoriaDetalheDto,
): RegistroAuditoriaDetalhe {
  return {
    id: String(dto.id),
    usuario: mapUsuario(dto.usuario),
    entidade: dto.entidade,
    entidadeId: dto.entidadeId ?? null,
    operacao: dto.operacao,
    motivo: dto.motivo ?? null,
    ocorridoEm: dto.ocorridoEm,
    estadoAnterior: dto.estadoAnterior ?? null,
    estadoNovo: dto.estadoNovo ?? null,
  };
}
