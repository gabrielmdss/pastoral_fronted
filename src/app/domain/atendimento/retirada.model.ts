export type RetiradaTipo =
  | 'TITULAR'
  | 'REPRESENTANTE'
  | 'PRIMEIRA_ENTREGA'
  | 'ANTECIPADA'
  | 'CONTINGENCIA';

export type RetiradaStatus = 'VALIDA' | 'ESTORNADA';

export type RetiradaFormaIdentificacao =
  | 'DOCUMENTO'
  | 'FOTO_HISTORICO'
  | 'REPRESENTANTE'
  | 'CONTINGENCIA';

export interface RetiradaRepresentante {
  nome: string;
  documentoMascarado: string | null;
  relacao: string | null;
  autorizacaoDeclaratoria: boolean;
}

export interface RetiradaRepresentanteInput {
  nome: string;
  documento: string | null;
  relacao: string | null;
  autorizacaoDeclaratoria: boolean;
}

export interface RegistrarRetiradaInput {
  beneficiarioId: string;
  tipo: 'TITULAR' | 'REPRESENTANTE';
  formaIdentificacao: 'DOCUMENTO' | 'REPRESENTANTE';
  representante: RetiradaRepresentanteInput | null;
  justificativaExcecao: null;
}

export interface Retirada {
  id: string;
  distribuicaoId: string;
  direitoId: string;
  beneficiario: { id: string; nomeCompleto: string };
  tipo: RetiradaTipo;
  status: RetiradaStatus;
  formaIdentificacao: RetiradaFormaIdentificacao | null;
  representante: RetiradaRepresentante | null;
  operador: { id: string; login: string };
  ocorridoEm: string;
}
