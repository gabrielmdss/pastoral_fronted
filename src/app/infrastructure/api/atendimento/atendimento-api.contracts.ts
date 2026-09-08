export type CheckInClassificacaoDto =
  | 'REGULAR'
  | 'PENDENTE';

export type CheckInFilaDto =
  | 'PRINCIPAL'
  | 'SECUNDARIA';

export type CheckInSituacaoOperacionalDto =
  | 'AGUARDANDO'
  | 'ATENDIDO'
  | 'NAO_ATENDIDO_ESTOQUE'
  | 'NAO_ATENDIDO_IRREGULARIDADE';

export type CheckInMotivoBloqueioDto =
  | 'DIREITO_JA_CONSUMIDO'
  | 'DIREITO_NAO_DISPONIVEL'
  | 'BENEFICIARIO_PENDENTE'
  | 'REGULARES_AGUARDANDO';

export interface CheckInBeneficiarioDto {
  id: string;
  nomeCompleto: string;
}

export interface CheckInPendenciaDto {
  codigo: string;
  grupoEsperado?: string;
  competencia?: string;
}

export interface CheckInDto {
  id: string;

  beneficiario: CheckInBeneficiarioDto;

  classificacao: CheckInClassificacaoDto;

  fila: CheckInFilaDto;

  situacaoOperacional: CheckInSituacaoOperacionalDto;
  podeRetirar: boolean;
  motivoBloqueio: CheckInMotivoBloqueioDto | null;

  pendencias: CheckInPendenciaDto[];

  ocorridoEm: string;
}

export interface DataResponse<T> {
  data: T;
}

export type RetiradaTipoDto =
  | 'TITULAR'
  | 'REPRESENTANTE'
  | 'PRIMEIRA_ENTREGA'
  | 'ANTECIPADA'
  | 'CONTINGENCIA';

export type RetiradaStatusDto = 'VALIDA' | 'ESTORNADA';

export type RetiradaFormaIdentificacaoDto =
  | 'DOCUMENTO'
  | 'FOTO_HISTORICO'
  | 'REPRESENTANTE'
  | 'CONTINGENCIA';

export interface RetiradaDto {
  id: string;
  distribuicaoId: string;
  direitoId: string;
  beneficiario: { id: string; nomeCompleto: string };
  tipo: RetiradaTipoDto;
  status: RetiradaStatusDto;
  formaIdentificacao: RetiradaFormaIdentificacaoDto | null;
  representante: {
    nome: string;
    documentoMascarado: string | null;
    relacao: string | null;
    autorizacaoDeclaratoria: boolean;
  } | null;
  operador: { id: string; login: string };
  ocorridoEm: string;
}

export interface RegistrarRetiradaDto {
  beneficiarioId: string;
  tipo: 'TITULAR' | 'REPRESENTANTE';
  formaIdentificacao: 'DOCUMENTO' | 'REPRESENTANTE';
  representante: {
    nome: string;
    documento: string | null;
    relacao: string | null;
    autorizacaoDeclaratoria: boolean;
  } | null;
  justificativaExcecao: null;
}

export interface HistoricoBeneficiarioDto {
  beneficiario: { id: string; nome: string };
  eventos: HistoricoBeneficiarioEventoDto[];
}

export interface HistoricoBeneficiarioEventoDto {
  tipo: string;
  ocorridoEm: string;
  detalhes: Record<string, unknown>;
}

export interface RegistrarJustificativaDto {
  descricao: string;
  momento: 'ANTES_DISTRIBUICAO' | 'DEPOIS_DISTRIBUICAO';
}

export interface AvaliarJustificativaDto {
  decisao: 'ACEITA' | 'REJEITADA';
  observacao?: string | null;
}
