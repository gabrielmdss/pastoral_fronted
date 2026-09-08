export interface InventarioDto {
  id: string;
  status: 'ABERTO' | 'CONCLUIDO' | 'CANCELADO';
  usuario_responsavel_id: string;
  iniciado_em: string;
  concluido_em: string | null;
  iniciadoEm: string;
  concluidoEm: string | null;
  itens: {
    apresentacaoId: string;
    insumo: string;
    apresentacao: string;
    saldoSistema: number;
    saldoFisico: number;
    diferenca: number;
  }[];
}
export interface ContagemInventarioRequest {
  saldoFisico: number;
}
