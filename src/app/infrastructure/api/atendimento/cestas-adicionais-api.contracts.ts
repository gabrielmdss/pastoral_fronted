export interface CestaAdicionalDto {
  id: string;
  beneficiario: { id: string; nomeCompleto: string };
  distribuicaoId: string;
  modeloCesta: { id: string; nome: string };
  quantidade: number;
  justificativa: string;
  status: 'AUTORIZADA' | 'ENTREGUE' | 'CANCELADA';
  autorizador: { id: string; login: string };
  autorizadoEm: string;
  entrega: { usuario: { id: string; login: string }; entregueEm: string } | null;
}
export interface AutorizarCestaAdicionalRequest {
  beneficiarioId: string;
  modeloCestaId: string;
  quantidade: number;
  justificativa: string;
}
