export interface ModeloInput {
  nome: string;
  tipo: 'REGULAR' | 'EMERGENCIAL' | 'ESPECIAL' | 'OUTRO';
}
export interface ModeloCesta extends ModeloInput {
  id: string;
  ativo: boolean;
  criadoEm: string;
}
export interface VersaoModeloInput {
  metaItens: number;
  itens: { apresentacaoInsumoId: string; quantidade: number }[];
}
export interface VersaoModelo extends VersaoModeloInput {
  id: string;
  numeroVersao: number;
  usuarioId: string;
  criadoEm: string;
  itens: {
    apresentacaoInsumoId: string;
    quantidade: number;
    insumo: string | null;
    apresentacao: string | null;
  }[];
}
export interface ModeloDetalhe extends ModeloCesta {
  versoes: VersaoModelo[];
}
