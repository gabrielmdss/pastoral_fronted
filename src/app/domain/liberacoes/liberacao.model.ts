export interface LiberacaoCestas {
  id: string;
  loteMontagemId: string;
  quantidadeLiberada: number;
  quantidadeConsumida: number;
  quantidadeRetornada: number;
  quantidadeDisponivel: number;
  usuarioId: string;
  liberadoEm: string;
}
export interface LiberarCestasInput {
  loteMontagemId: string;
  quantidade: number;
}
