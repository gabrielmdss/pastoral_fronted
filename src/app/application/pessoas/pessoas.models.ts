export interface PessoaFiltro {
  q?: string;
  documento?: string;
}
export interface CriarPessoaInput {
  nomeCompleto: string;
  dataNascimento: string | null;
  telefone: string | null;
  documentos: Array<{ tipo: string; numero: string; principal: boolean }>;
}
