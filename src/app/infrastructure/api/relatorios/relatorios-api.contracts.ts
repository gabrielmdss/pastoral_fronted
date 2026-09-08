export interface PaginaRelatorioDto<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
export interface DistribuicaoRelatorioDto {
  id: string;
  data: string;
  status: 'PLANEJADA' | 'PREPARADA' | 'ABERTA' | 'ENCERRADA';
  ano: number;
  mes: number;
  grupoId: string;
  grupo: string;
  previstos: number;
  presentes: number;
  retirados: number;
  ausentes: number;
  naoAtendidosEstoque: number;
  naoAtendidosIrregularidade: number;
  extras: number;
}
export interface BeneficiarioRelatorioDto {
  id: string;
  beneficiario: string;
  situacaoAtual: 'ATIVO' | 'DESLIGADO';
  dataAdmissao: string;
  grupoId: string | null;
  grupo: string | null;
  ultimaRetirada: string | null;
  quantidadeRetiradas: number;
  ausencias: number;
}
export interface EstoqueRelatorioDto {
  apresentacaoInsumoId: string;
  insumo: string;
  apresentacao: string;
  entradas: number;
  saidas: number;
  perdas: number;
  ajustes: number;
  saldoPeriodo: number;
  saldo: number;
}
