export interface CategoriaInsumoDto {
  id: string;
  codigo: string;
  descricao: string;
  ordemPrioridade: number;
}
export interface InsumoSaldoDto {
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
export interface DoadorDto {
  id: string;
  tipo: 'PESSOA' | 'INSTITUICAO';
  nome: string;
  telefone: string | null;
  observacao: string | null;
  ativo: boolean;
  criadoEm: string;
}
export interface EntradaRequestDto {
  tipo: 'DOACAO' | 'COMPRA' | 'SALDO_INICIAL' | 'AJUSTE_POSITIVO';
  doadorId: string | null;
  dataEntrada: string | null;
  observacao: string | null;
  itens: { apresentacaoInsumoId: string; quantidade: number; validade: string | null }[];
}
export interface PerdaRequestDto {
  apresentacaoInsumoId: string;
  quantidade: number;
  motivoId: string;
  observacao: string | null;
}
