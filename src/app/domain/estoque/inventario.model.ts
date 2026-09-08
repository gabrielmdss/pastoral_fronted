export interface InventarioItem {
  apresentacaoId: string;
  insumo: string;
  apresentacao: string;
  saldoSistema: number;
  saldoFisico: number;
  diferenca: number;
}
export interface Inventario {
  id: string;
  status: 'ABERTO' | 'CONCLUIDO' | 'CANCELADO';
  usuarioResponsavelId: string;
  iniciadoEm: string;
  concluidoEm: string | null;
  itens: InventarioItem[];
}
