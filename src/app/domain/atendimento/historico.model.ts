/** Evento retornado por GET /beneficiarios/:id/historico e /distribuicoes/:id/historico. */
export interface HistoricoEvento {
  tipo: string;
  ocorridoEm: string;
  detalhes: Record<string, unknown>;
}

export interface HistoricoBeneficiario {
  beneficiario: { id: string; nome: string };
  eventos: HistoricoEvento[];
}

export interface HistoricoDistribuicao {
  distribuicao: { id: string; data: string; grupo: string };
  eventos: HistoricoEvento[];
}
