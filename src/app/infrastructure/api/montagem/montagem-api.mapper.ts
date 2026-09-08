import type { LoteMontagem } from '../../../domain/montagem/montagem.model';
import type { LoteMontagemDto } from './montagem-api.contracts';
export function mapLote(dto: LoteMontagemDto): LoteMontagem {
  return {
    id: dto.id,
    quantidadeMontada: dto.quantidadeMontada,
    quantidadeDisponivel: dto.quantidadeDisponivel,
    status: dto.status,
    possuiAjustes: dto.possuiAjustes === true,
    permiteDesmontagemParcial: dto.permiteDesmontagemParcial === true,
    podeAjustar: dto.podeAjustar === true,
    podeDesmontar: dto.podeDesmontar === true,
    montadoEm: dto.montadoEm,
    planejamento: { ...dto.planejamento },
    responsavel: { ...dto.responsavel },
    itens: dto.itens.map((i) => ({ ...i })),
  };
}
