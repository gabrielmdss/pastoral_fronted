export interface Capacidade {
  capacidade: number;
  ativos: number;
  vagas: number;
  excedente: number;
}
export interface AlterarCapacidadeInput {
  capacidade: number;
  justificativa: string;
}
