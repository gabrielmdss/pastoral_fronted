import type { ModeloCesta, ModeloDetalhe } from '../../../domain/cestas/modelo-cesta.model';
import type { ModeloDto, ModeloDetalheDto } from './modelos-api.contracts';
export function mapModelo(d: ModeloDto): ModeloCesta {
  return { id: d.id, nome: d.nome, tipo: d.tipo, ativo: d.ativo, criadoEm: d.criadoEm };
}
export function mapModeloDetalhe(d: ModeloDetalheDto): ModeloDetalhe {
  return {
    ...mapModelo(d),
    versoes: d.versoes.map((v) => ({ ...v, itens: v.itens.map((i) => ({ ...i })) })),
  };
}
