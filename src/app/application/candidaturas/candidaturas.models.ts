export interface CandidaturaFiltro {
  status?: string;
  nome?: string;
  documento?: string;
}
export interface AdmitirCandidaturaInput {
  grupoId: string;
  autorizarAcimaCapacidade: boolean;
  justificativaExcecao: string | null;
}
export interface ContatoInput {
  resultado: string;
  observacao: string | null;
}
