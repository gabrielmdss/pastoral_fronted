export type MomentoJustificativa =
  | 'ANTES_DISTRIBUICAO'
  | 'DEPOIS_DISTRIBUICAO';

export type DecisaoJustificativa = 'PENDENTE' | 'ACEITA' | 'REJEITADA';

export interface JustificativaAusenciaHistorico {
  id: string;
  ausenciaId: string;
  decisao: DecisaoJustificativa;
  momento: MomentoJustificativa;
  ocorridoEm: string;
}

export interface AusenciaAtendimento {
  id: string;
  status: string;
  competenciaId: string;
  ocorridoEm: string;
  justificativas: JustificativaAusenciaHistorico[];
}

export interface RegistrarJustificativaInput {
  descricao: string;
  momento: MomentoJustificativa;
}

export interface AvaliarJustificativaInput {
  decisao: Exclude<DecisaoJustificativa, 'PENDENTE'>;
  observacao?: string | null;
}
