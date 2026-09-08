export type CheckInClassificacao =
  | 'REGULAR'
  | 'PENDENTE';

export type CheckInFila =
  | 'PRINCIPAL'
  | 'SECUNDARIA';

export type CheckInSituacaoOperacional =
  | 'AGUARDANDO'
  | 'ATENDIDO'
  | 'NAO_ATENDIDO_ESTOQUE'
  | 'NAO_ATENDIDO_IRREGULARIDADE';

export type CheckInMotivoBloqueio =
  | 'DIREITO_JA_CONSUMIDO'
  | 'DIREITO_NAO_DISPONIVEL'
  | 'BENEFICIARIO_PENDENTE'
  | 'REGULARES_AGUARDANDO';

export interface CheckInBeneficiario {
  id: string;
  nomeCompleto: string;
}

export interface CheckInPendencia {
  codigo: string;
  grupoEsperado?: string;
  competencia?: string;
}

export interface CheckIn {
  id: string;

  beneficiario: CheckInBeneficiario;

  classificacao: CheckInClassificacao;

  fila: CheckInFila;

  situacaoOperacional: CheckInSituacaoOperacional;
  podeRetirar: boolean;
  motivoBloqueio: CheckInMotivoBloqueio | null;

  pendencias: CheckInPendencia[];

  ocorridoEm: string;
}
