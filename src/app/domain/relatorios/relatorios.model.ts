export type RelatorioTipo = 'distribuicoes' | 'beneficiarios' | 'estoque';
export interface Paginacao {
  page: number;
  limit: number;
}
export interface PaginaRelatorio<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
export type StatusDistribuicaoRelatorio = 'PLANEJADA' | 'PREPARADA' | 'ABERTA' | 'ENCERRADA';
export type StatusBeneficiarioRelatorio = 'ATIVO' | 'DESLIGADO';
export type TipoMovimentoRelatorio =
  'ENTRADA' | 'CONSUMO_MONTAGEM' | 'RETORNO_DESMONTAGEM' | 'PERDA' | 'AJUSTE_INVENTARIO';
export interface FiltroDistribuicoes extends Paginacao {
  dataInicio?: string;
  dataFim?: string;
  competencia?: string;
  grupoId?: string;
  status?: StatusDistribuicaoRelatorio;
}
export interface FiltroBeneficiarios extends Paginacao {
  status?: StatusBeneficiarioRelatorio;
  grupoId?: string;
  dataAdmissaoInicio?: string;
  dataAdmissaoFim?: string;
}
export interface FiltroEstoque extends Paginacao {
  insumo?: string;
  tipoMovimento?: TipoMovimentoRelatorio;
  dataInicio?: string;
  dataFim?: string;
}
export interface LinhaDistribuicao {
  id: string;
  data: string;
  status: StatusDistribuicaoRelatorio;
  ano: number;
  mes: number;
  grupoId: string;
  grupo: string;
  previstos: number;
  presentes: number;
  retirados: number;
  ausentes: number;
  naoAtendidosEstoque: number;
  naoAtendidosIrregularidade: number;
  extras: number;
}
export interface LinhaBeneficiario {
  id: string;
  beneficiario: string;
  situacaoAtual: StatusBeneficiarioRelatorio;
  dataAdmissao: string;
  grupoId: string | null;
  grupo: string | null;
  ultimaRetirada: string | null;
  quantidadeRetiradas: number;
  ausencias: number;
}
export interface LinhaEstoque {
  apresentacaoInsumoId: string;
  insumo: string;
  apresentacao: string;
  entradas: number;
  saidas: number;
  perdas: number;
  ajustes: number;
  saldoPeriodo: number;
  saldo: number;
}
export type ResultadoRelatorio =
  | { tipo: 'distribuicoes'; pagina: PaginaRelatorio<LinhaDistribuicao> }
  | { tipo: 'beneficiarios'; pagina: PaginaRelatorio<LinhaBeneficiario> }
  | { tipo: 'estoque'; pagina: PaginaRelatorio<LinhaEstoque> };
