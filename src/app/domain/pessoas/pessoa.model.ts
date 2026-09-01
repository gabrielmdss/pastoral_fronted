export interface PessoaDocumento {
  tipo: string;
  numeroMascarado: string;
}
export interface Pessoa {
  id: string;
  nomeCompleto: string;
  dataNascimento: string | null;
  documentos: PessoaDocumento[];
  beneficiario: { id: string; status: string } | null;
  telefone?: string | null;
}
