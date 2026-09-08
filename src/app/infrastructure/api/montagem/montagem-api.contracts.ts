export interface LoteMontagemDto {
  id: string;
  quantidadeMontada: number;
  quantidadeDisponivel: number;
  status: 'ATIVO' | 'ESGOTADO' | 'DESMONTADO';
  possuiAjustes?: boolean;
  permiteDesmontagemParcial?: boolean;
  podeAjustar?: boolean;
  podeDesmontar?: boolean;
  montadoEm: string;
  planejamento: { id: string; versaoId: string; numeroVersao: number };
  responsavel: { id: string; login: string };
  itens: { apresentacaoInsumoId: string; quantidadePorCesta: number; quantidadeTotal?: number }[];
}
export interface MontarLoteRequest {
  planejamentoVersaoId: string;
  quantidade: number;
}
export interface DesmontarLoteRequest {
  quantidade: number;
  motivo: string;
}
export interface AjustarLoteRequest {
  quantidadeCestasAfetadas: number;
  motivo: string;
  itens: {
    apresentacaoInsumoId: string;
    operacao: 'ADICIONAR' | 'REMOVER';
    quantidadePorCesta: number;
  }[];
}
