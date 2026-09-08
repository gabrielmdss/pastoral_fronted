export interface ModeloDto {
  id: string;
  nome: string;
  tipo: 'REGULAR' | 'EMERGENCIAL' | 'ESPECIAL' | 'OUTRO';
  ativo: boolean;
  criadoEm: string;
}
export interface ModeloDetalheDto extends ModeloDto {
  versoes: {
    id: string;
    numeroVersao: number;
    metaItens: number;
    usuarioId: string;
    criadoEm: string;
    itens: {
      apresentacaoInsumoId: string;
      quantidade: number;
      insumo: string | null;
      apresentacao: string | null;
    }[];
  }[];
}
export interface VersaoModeloRequestDto {
  metaItens: number;
  itens: { apresentacaoInsumoId: string; quantidade: number }[];
}
