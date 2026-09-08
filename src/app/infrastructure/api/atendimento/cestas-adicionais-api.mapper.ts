import type { CestaAdicional } from '../../../domain/atendimento/cesta-adicional.model';
import type { CestaAdicionalDto } from './cestas-adicionais-api.contracts';
export function mapCestaAdicional(dto: CestaAdicionalDto): CestaAdicional {
  return {
    id: dto.id,
    beneficiario: { ...dto.beneficiario },
    distribuicaoId: dto.distribuicaoId,
    modeloCesta: { ...dto.modeloCesta },
    quantidade: dto.quantidade,
    justificativa: dto.justificativa,
    status: dto.status,
    autorizador: { ...dto.autorizador },
    autorizadoEm: dto.autorizadoEm,
    entrega: dto.entrega
      ? { usuario: { ...dto.entrega.usuario }, entregueEm: dto.entrega.entregueEm }
      : null,
  };
}
