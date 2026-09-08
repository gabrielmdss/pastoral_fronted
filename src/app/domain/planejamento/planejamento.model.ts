export interface PlanejamentoInput {
  competenciaId: string;
  modeloCestaVersaoId: string;
  quantidade: number;
}
export interface RevisaoPlanejamentoInput {
  modeloCestaVersaoId: string;
  quantidade: number;
  motivo: string;
}
export interface Planejamento {
  id: string;
  competenciaId: string;
  ano: number;
  mes: number;
  modeloCestaId: string;
  modelo: string;
  criadoEm: string;
}
export type PlanejamentoStatus = 'SIMULACAO' | 'APROVADA' | 'SUBSTITUIDA' | 'CONCLUIDA';
export interface PlanejamentoVersao {
  id: string;
  numeroVersao: number;
  quantidadePlanejada: number;
  status: PlanejamentoStatus;
  usuarioAprovadorId: string | null;
  aprovadoEm: string | null;
  motivoRevisao: string | null;
  itens: {
    apresentacaoInsumoId: string;
    quantidadePorCesta: number;
    reservado: number | null;
    consumido: number | null;
  }[];
}
export interface PlanejamentoDetalhe extends Planejamento {
  versoes: PlanejamentoVersao[];
}
export interface SimulacaoPlanejamento extends PlanejamentoInput {
  capacidadeMaxima: number;
  cobertura: number;
  itensLimitantes: string[];
  itens: {
    apresentacaoInsumoId: string;
    insumo: string;
    apresentacao: string;
    quantidadePorCesta: number;
    necessidade: number;
    saldoFisico: number;
    saldoReservado: number;
    saldoDisponivel: number;
    deficit: number;
    capacidade: number;
  }[];
}
