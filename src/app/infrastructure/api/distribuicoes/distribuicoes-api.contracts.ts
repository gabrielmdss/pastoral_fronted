export type DistribuicaoStatusDto =
  | 'PLANEJADA'
  | 'PREPARADA'
  | 'ABERTA'
  | 'ENCERRADA';

export interface DistribuicaoCompetenciaDto {
  id: string;
  ano: number;
  mes: number;
}

export interface DistribuicaoGrupoDto {
  id: string;
  codigo: string;
  nome: string;
}

export interface DistribuicaoDto {
  id: string;

  competencia: DistribuicaoCompetenciaDto;

  grupo: DistribuicaoGrupoDto;

  dataPrevista: string;
  dataReal: string | null;

  status: DistribuicaoStatusDto;

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

export interface ListarDistribuicoesResponseDto {
  data: DistribuicaoDto[];
}

export interface ObterDistribuicaoResponseDto {
  data: DistribuicaoDto;
}
export interface RemarcarDistribuicaoRequestDto { novaData: string; motivo: string; }
