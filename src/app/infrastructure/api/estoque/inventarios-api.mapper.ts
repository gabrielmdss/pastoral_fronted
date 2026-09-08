import type { Inventario } from '../../../domain/estoque/inventario.model';
import type { InventarioDto } from './inventarios-api.contracts';
export function mapInventario(dto: InventarioDto): Inventario {
  return {
    id: dto.id,
    status: dto.status,
    usuarioResponsavelId: dto.usuario_responsavel_id,
    iniciadoEm: dto.iniciadoEm,
    concluidoEm: dto.concluidoEm,
    itens: dto.itens.map((i) => ({ ...i })),
  };
}
