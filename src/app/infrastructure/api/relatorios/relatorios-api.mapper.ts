import type * as D from './relatorios-api.contracts';
import type * as M from '../../../domain/relatorios/relatorios.model';
export function mapDistribuicoes(
  dto: D.PaginaRelatorioDto<D.DistribuicaoRelatorioDto>,
): M.PaginaRelatorio<M.LinhaDistribuicao> {
  return { meta: { ...dto.meta }, data: dto.data.map((r) => ({ ...r })) };
}
export function mapBeneficiarios(
  dto: D.PaginaRelatorioDto<D.BeneficiarioRelatorioDto>,
): M.PaginaRelatorio<M.LinhaBeneficiario> {
  return { meta: { ...dto.meta }, data: dto.data.map((r) => ({ ...r })) };
}
export function mapEstoque(
  dto: D.PaginaRelatorioDto<D.EstoqueRelatorioDto>,
): M.PaginaRelatorio<M.LinhaEstoque> {
  return { meta: { ...dto.meta }, data: dto.data.map((r) => ({ ...r })) };
}
