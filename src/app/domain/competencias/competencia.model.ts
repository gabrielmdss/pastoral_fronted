export interface Competencia {
  id: string;
  ano: number;
  mes: number;
  status: string;
  distribuicoes: number;
  direitos: number;
}
export interface GerarCompetenciaInput { ano: number; mes: number; }

