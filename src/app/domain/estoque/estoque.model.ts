export interface CategoriaInsumo {
  id: string;
  codigo: string;
  descricao: string;
  ordemPrioridade: number;
}
export interface InsumoSaldo {
  apresentacaoId: string;
  insumoId: string;
  insumo: string;
  apresentacao: string;
  categoria: { id: string; codigo: string | null } | null;
  quantidadeReferencia: number | null;
  unidadeMedida: string | null;
  saldoFisico: number;
  saldoReservado: number;
  saldoDisponivel: number;
}
export interface DoadorInput {
  tipo: 'PESSOA' | 'INSTITUICAO';
  nome: string;
  telefone: string | null;
  observacao: string | null;
}
export interface Doador extends DoadorInput {
  id: string;
  ativo: boolean;
  criadoEm: string;
}
export interface InsumoInput {
  nome: string;
  categoriaPrioridadeId: string | null;
  apresentacao: {
    descricao: string;
    quantidadeReferencia: number | null;
    unidadeMedida: string | null;
  };
}
export interface EntradaInput {
  tipo: 'DOACAO' | 'COMPRA' | 'SALDO_INICIAL' | 'AJUSTE_POSITIVO';
  doadorId: string | null;
  dataEntrada: string | null;
  observacao: string | null;
  itens: { apresentacaoInsumoId: string; quantidade: number; validade: string | null }[];
}
export interface PerdaInput {
  apresentacaoInsumoId: string;
  quantidade: number;
  motivoId: string;
  observacao: string | null;
}
