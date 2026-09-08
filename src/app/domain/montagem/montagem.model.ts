export interface LoteMontagem {
  id: string;
  quantidadeMontada: number;
  quantidadeDisponivel: number;
  status: 'ATIVO' | 'ESGOTADO' | 'DESMONTADO';
  possuiAjustes: boolean;
  permiteDesmontagemParcial: boolean;
  podeAjustar: boolean;
  podeDesmontar: boolean;
  montadoEm: string;
  planejamento: { id: string; versaoId: string; numeroVersao: number };
  responsavel: { id: string; login: string };
  itens: { apresentacaoInsumoId: string; quantidadePorCesta: number; quantidadeTotal?: number }[];
}
export interface MontarLoteInput {
  planejamentoVersaoId: string;
  quantidade: number;
}
export interface DesmontarLoteInput {
  quantidade: number;
  motivo: string;
}
export interface AjustarLoteInput {
  quantidadeCestasAfetadas: number;
  motivo: string;
  itens: {
    apresentacaoInsumoId: string;
    operacao: 'ADICIONAR' | 'REMOVER';
    quantidadePorCesta: number;
  }[];
}
