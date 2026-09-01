export type BeneficiarioStatus = 'ATIVO' | 'DESLIGADO';
export interface DocumentoResumo {
  tipo: string;
  numeroMascarado: string;
}
export interface BeneficiarioResumo {
  id: string;
  nomeCompleto: string;
  status: BeneficiarioStatus;
  grupo: { id: string; codigo: string | null } | null;
  fotoPrincipal: string | null;
  documentos: DocumentoResumo[];
}
export interface BeneficiarioDetalhe {
  id: string;
  status: BeneficiarioStatus;
  dataAdmissao: string;
  pessoa: {
    id: string;
    nomeCompleto: string;
    dataNascimento: string | null;
    telefone: string | null;
    fotoPrincipal: { storageKey: string; mimeType: string | null } | null;
    documentos: DocumentoResumo[];
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
  direitoAtual: DireitoBeneficio | null;
  proximoDireito: DireitoBeneficio | null;
  pendenciasAtuais: Array<{ codigo: string; competencia: string }>;
  historicoResumido: Array<{ tipo: string; ocorridoEm: string; descricao: string }>;
}
export interface DireitoBeneficio {
  id: string;
  competencia: string;
  status: string;
  distribuicaoPrevistaId: string | null;
  dataPrevista: string | null;
}
