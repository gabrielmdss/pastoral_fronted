export interface LiberacaoCestasDto {
  id: string;
  loteMontagemId: string;
  quantidadeLiberada: number;
  quantidadeConsumida: number;
  quantidadeRetornada: number;
  quantidadeDisponivel: number;
  usuarioId: string;
  liberadoEm: string;
}
export interface LiberarCestasRequest {
  loteMontagemId: string;
  quantidade: number;
}
