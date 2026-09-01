export interface Candidatura {
  id: string;
  pessoaId: string;
  nome: string;
  documentos: Array<{ tipo: string; numeroMascarado: string }>;
  status: string;
  dataEntrada: string;
  prioridadeExcepcional: boolean;
  tentativasContato: number;
  ultimaTentativaContato: {
    resultado: string | null;
    observacao: string | null;
    ocorridoEm: string;
  } | null;
}
