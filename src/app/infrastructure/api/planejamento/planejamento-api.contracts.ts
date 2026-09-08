export interface PlanejamentoDto {
  id: string;
  competenciaId: string;
  ano: number;
  mes: number;
  modeloCestaId: string;
  modelo: string;
  criadoEm: string;
}
export interface PlanejamentoDetalheDto extends PlanejamentoDto {
  versoes: {
    id: string;
    numeroVersao: number;
    quantidadePlanejada: number;
    status: 'SIMULACAO' | 'APROVADA' | 'SUBSTITUIDA' | 'CONCLUIDA';
    usuarioAprovadorId: string | null;
    aprovadoEm: string | null;
    motivoRevisao: string | null;
    itens: {
      apresentacaoInsumoId: string;
      quantidadePorCesta: number;
      reservado: number | null;
      consumido: number | null;
    }[];
  }[];
}
export interface PlanejamentoRequestDto {
  competenciaId: string;
  modeloCestaVersaoId: string;
  quantidade: number;
}
export interface RevisaoRequestDto {
  modeloCestaVersaoId: string;
  quantidade: number;
  motivo: string;
}
export interface SimulacaoDto extends PlanejamentoRequestDto {
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
