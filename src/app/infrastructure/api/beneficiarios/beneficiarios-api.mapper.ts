import type {
  BeneficiarioDetalhe,
  BeneficiarioResumo,
  BeneficiarioStatus,
} from '../../../domain/beneficiarios/beneficiario.model';
import type { BeneficiarioDetalheDto, BeneficiarioResumoDto } from './beneficiarios-api.contracts';
export function mapBeneficiarioResumo(d: BeneficiarioResumoDto): BeneficiarioResumo {
  return {
    id: String(d.id),
    pessoaId: String(d.pessoaId),
    nomeCompleto: d.nomeCompleto,
    status: d.status as BeneficiarioStatus,
    grupo: d.grupo ? { id: String(d.grupo.id), codigo: d.grupo.codigo } : null,
    fotoPrincipal: d.fotoPrincipal ? { ...d.fotoPrincipal } : null,
    documentos: d.documentos.map((x) => ({ ...x })),
  };
}
export function mapBeneficiarioDetalhe(d: BeneficiarioDetalheDto): BeneficiarioDetalhe {
  return {
    ...d,
    id: String(d.id),
    pessoa: {
      ...d.pessoa,
      documentos: d.pessoa.documentos.map((x) => ({ ...x })),
      enderecoPrincipal: d.pessoa.enderecoPrincipal ? { ...d.pessoa.enderecoPrincipal } : null,
    },
    grupo: d.grupo ? { ...d.grupo } : null,
    pendenciasAtuais: d.pendenciasAtuais.map((x) => ({ ...x })),
    historicoResumido: d.historicoResumido.map((x) => ({ ...x })),
  };
}
