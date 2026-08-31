export type CoverageStatus = 'SAUDAVEL' | 'ATENCAO' | 'CRITICO' | 'SEM_PLANEJAMENTO';
export interface Coverage { demanda: number; capacidadeGarantida: number; coberturaPercentual: number; deficitCestas: number; status: CoverageStatus; }
export interface Dashboard {
  beneficiarios: { capacidade: number; ativos: number; vagas: number; excedente: number; listaEspera: number };
  proximaDistribuicao: { id: string | null; data: string; grupo: string; status: string; previstos: number; checkIns: number; retiradas: number; cestasMontadasCompativeis: number; cestasLiberadas: number } | null;
  saude: { proximaDistribuicao: Coverage; competenciaAtual: Coverage; competenciaSeguinte: Omit<Coverage, 'deficitCestas'> | null };
  competenciaAtual: { id: string | null; competencia: string; status: string; demanda: number; direitos: number; retirados: number; disponiveis: number; ausentes: number; naoAtendidosEstoque: number; naoAtendidosIrregularidade: number; planejado: number; montado: number; entregue: number } | null;
  estoque: { insumosAtivos: number; itensComEstoque: number; itensCriticos: number; cestasMontadas: number; cestasReservadasParaDistribuicoes: number };
  insumosCriticos: Array<{ apresentacaoInsumoId: string; nome: string; apresentacao: string; necessario: number; fisico: number; reservado: number; disponivel: number; deficit: number; capacidade: number; capacidadeProjetada: number; limitante: boolean }>;
  alertas: Array<{ codigo: string; nivel: string; mensagem: string }>;
}
