import type { LiberacaoCestas } from '../../../domain/liberacoes/liberacao.model';
import type { LiberacaoCestasDto } from './liberacoes-api.contracts';
export function mapLiberacao(dto: LiberacaoCestasDto): LiberacaoCestas {
  return {
    id: dto.id,
    loteMontagemId: dto.loteMontagemId,
    quantidadeLiberada: dto.quantidadeLiberada,
    quantidadeConsumida: dto.quantidadeConsumida,
    quantidadeRetornada: dto.quantidadeRetornada,
    quantidadeDisponivel: dto.quantidadeDisponivel,
    usuarioId: dto.usuarioId,
    liberadoEm: dto.liberadoEm,
  };
}
