import type { Candidatura } from '../../../domain/candidaturas/candidatura.model';
import type { CandidaturaDto } from './candidaturas-api.contracts';
export function mapCandidatura(d: CandidaturaDto): Candidatura {
  return {
    id: String(d.id),
    pessoaId: String(d.pessoaId),
    nome: d.nome,
    documentos: d.documentos.map((document) => ({ ...document })),
    status: d.status,
    dataEntrada: d.dataEntrada,
    prioridadeExcepcional: d.prioridadeExcepcional,
    tentativasContato: Number(d.tentativasContato),
    ultimaTentativaContato: d.ultimaTentativaContato ? { ...d.ultimaTentativaContato } : null,
  };
}
