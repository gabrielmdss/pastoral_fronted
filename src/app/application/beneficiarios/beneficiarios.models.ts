export interface BeneficiarioFiltro {
  nome?: string;
  documento?: string;
  status?: string;
  grupoId?: string;
}
export interface AdmitirBeneficiarioInput {
  pessoaId: string;
  grupoId: string;
  autorizarAcimaCapacidade: boolean;
  justificativaExcecao: string | null;
}
export interface AlterarGrupoInput {
  grupoDestinoId: string;
  vigenciaCompetenciaAtual: boolean;
  motivo: string;
}
export interface DesligarBeneficiarioInput {
  motivoId: string;
  observacao: string | null;
}
