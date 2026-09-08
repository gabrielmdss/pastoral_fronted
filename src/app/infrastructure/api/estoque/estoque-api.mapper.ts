import type { InsumoSaldo, CategoriaInsumo, Doador } from '../../../domain/estoque/estoque.model';
import type { InsumoSaldoDto, CategoriaInsumoDto, DoadorDto } from './estoque-api.contracts';
export function mapInsumo(dto: InsumoSaldoDto): InsumoSaldo {
  return {
    apresentacaoId: dto.apresentacaoId,
    insumoId: dto.insumoId,
    insumo: dto.insumo,
    apresentacao: dto.apresentacao,
    categoria: dto.categoria ? { ...dto.categoria } : null,
    quantidadeReferencia: dto.quantidadeReferencia,
    unidadeMedida: dto.unidadeMedida,
    saldoFisico: dto.saldoFisico,
    saldoReservado: dto.saldoReservado,
    saldoDisponivel: dto.saldoDisponivel,
  };
}
export function mapCategoria(dto: CategoriaInsumoDto): CategoriaInsumo {
  return {
    id: dto.id,
    codigo: dto.codigo,
    descricao: dto.descricao,
    ordemPrioridade: dto.ordemPrioridade,
  };
}
export function mapDoador(dto: DoadorDto): Doador {
  return {
    id: dto.id,
    tipo: dto.tipo,
    nome: dto.nome,
    telefone: dto.telefone,
    observacao: dto.observacao,
    ativo: dto.ativo,
    criadoEm: dto.criadoEm,
  };
}
