export interface BeneficiarioResumoDto {
  id: string;
  nomeCompleto: string;
  status: string;
  grupo: { id: string; codigo: string | null } | null;
  fotoPrincipal: string | null;
  documentos: Array<{ tipo: string; numeroMascarado: string }>;
}
export interface BeneficiarioDetalheDto {
  id: string;
  status: 'ATIVO' | 'DESLIGADO';
  dataAdmissao: string;
  pessoa: {
    id: string;
    nomeCompleto: string;
    dataNascimento: string | null;
    telefone: string | null;
    fotoPrincipal: { storageKey: string; mimeType: string | null } | null;
    documentos: Array<{ tipo: string; numeroMascarado: string }>;
    enderecoPrincipal: {
      cep: string | null;
      logradouro: string | null;
      numero: string | null;
      complemento: string | null;
      bairro: string | null;
      cidade: string | null;
      uf: string | null;
    } | null;
  };
  grupo: { id: string; codigo: string; nome: string } | null;
  ultimaRetirada: { id: string; ocorridoEm: string; tipo: string } | null;
  direitoAtual: {
    id: string;
    competencia: string;
    status: string;
    distribuicaoPrevistaId: string | null;
    dataPrevista: string | null;
  } | null;
  proximoDireito: BeneficiarioDetalheDto['direitoAtual'];
  pendenciasAtuais: Array<{ codigo: string; competencia: string }>;
  historicoResumido: Array<{ tipo: string; ocorridoEm: string; descricao: string }>;
}
export interface DataResponse<T> {
  data: T;
}
