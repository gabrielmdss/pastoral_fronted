import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { BeneficiariosApiPort } from './beneficiarios-api.port';
import { BuscarBeneficiariosUseCase, ObterBeneficiarioUseCase } from './beneficiarios.use-cases';
describe('use cases de beneficiários', () => {
  const port = {
    listar: vi.fn(() => of([])),
    obter: vi.fn(() =>
      of({ id: '1', pessoaId: '2', status: 'ATIVO' as const, grupoDistribuicaoId: null }),
    ),
  } as unknown as BeneficiariosApiPort;
  it('delega filtros da busca', () => {
    new BuscarBeneficiariosUseCase(port).execute({ documento: '123' }).subscribe();
    expect(port.listar).toHaveBeenCalledWith({ documento: '123' });
  });
  it('obtém por id', () => {
    new ObterBeneficiarioUseCase(port).execute('1').subscribe((x) => expect(x.id).toBe('1'));
  });
});
