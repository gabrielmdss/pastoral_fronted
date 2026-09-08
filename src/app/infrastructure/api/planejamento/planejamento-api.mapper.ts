import type {
  Planejamento,
  PlanejamentoDetalhe,
  SimulacaoPlanejamento,
} from '../../../domain/planejamento/planejamento.model';
import type {
  PlanejamentoDto,
  PlanejamentoDetalheDto,
  SimulacaoDto,
} from './planejamento-api.contracts';
export function mapPlanejamento(d: PlanejamentoDto): Planejamento {
  return {
    id: d.id,
    competenciaId: d.competenciaId,
    ano: d.ano,
    mes: d.mes,
    modeloCestaId: d.modeloCestaId,
    modelo: d.modelo,
    criadoEm: d.criadoEm,
  };
}
export function mapPlanejamentoDetalhe(d: PlanejamentoDetalheDto): PlanejamentoDetalhe {
  return {
    ...mapPlanejamento(d),
    versoes: d.versoes.map((v) => ({
      id: v.id,
      numeroVersao: v.numeroVersao,
      quantidadePlanejada: v.quantidadePlanejada,
      status: v.status,
      usuarioAprovadorId: v.usuarioAprovadorId,
      aprovadoEm: v.aprovadoEm,
      motivoRevisao: v.motivoRevisao,
      itens: v.itens.map((i) => ({ ...i })),
    })),
  };
}
export function mapSimulacao(d: SimulacaoDto): SimulacaoPlanejamento {
  return {
    competenciaId: d.competenciaId,
    modeloCestaVersaoId: d.modeloCestaVersaoId,
    quantidade: d.quantidade,
    capacidadeMaxima: d.capacidadeMaxima,
    cobertura: d.cobertura,
    itensLimitantes: [...d.itensLimitantes],
    itens: d.itens.map((i) => ({ ...i })),
  };
}
