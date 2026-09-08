export type DistribuicaoStatus =
  | 'PLANEJADA'
  | 'PREPARADA'
  | 'ABERTA'
  | 'ENCERRADA';

export interface DistribuicaoGrupo {
  id: string;
  codigo: string;
  nome: string;
}

export interface DistribuicaoCompetencia {
  id: string;
  ano: number;
  mes: number;
}

export interface Distribuicao {
  id: string;

  status: DistribuicaoStatus;

  dataPrevista: string;
  dataReal: string | null;

  competencia: DistribuicaoCompetencia;
  grupo: DistribuicaoGrupo;

  previstos: number;

  checkIns: number;
  regularesPresentes: number;
  pendentesPresentes: number;

  retiradas: number;
  ausentes: number;
  naoAtendidosEstoque: number;
  naoAtendidosIrregularidade: number;

  cestasLiberadas: number;
  cestasConsumidas: number;
  cestasRetornadas: number;
  cestasDisponiveis: number;
}
export interface RemarcarDistribuicaoInput { novaData: string; motivo: string; }
