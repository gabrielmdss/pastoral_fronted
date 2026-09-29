import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AUDITORIA_API } from '../../../application/auditoria/auditoria-api.port';
import {
  ListarAuditoriaUseCase,
  ObterAuditoriaUseCase,
} from '../../../application/auditoria/auditoria.use-cases';
import AuditoriaPage from './auditoria.page';
const registro = {
  id: '10',
  usuario: { id: '1', login: 'admin' },
  entidade: 'DOADOR',
  entidadeId: '4',
  operacao: 'CRIACAO',
  motivo: null,
  ocorridoEm: '2026-09-01T10:00:00.000Z',
  possuiEstadoAnterior: false,
  possuiEstadoNovo: true,
};
async function setup() {
  const api = {
    listar: vi.fn(() =>
      of({ data: [registro], meta: { page: 1, limit: 20, total: 30, totalPages: 2 } }),
    ),
    obter: vi.fn(() =>
      of({
        ...registro,
        estadoAnterior: null,
        estadoNovo: { nome: 'Ana' },
      }),
    ),
  };
  TestBed.configureTestingModule({
    providers: [
      ListarAuditoriaUseCase,
      ObterAuditoriaUseCase,
      { provide: AUDITORIA_API, useValue: api },
    ],
  });
  const fixture = TestBed.createComponent(AuditoriaPage);
  const page = fixture.componentInstance;
  await vi.waitFor(() => expect(page.loading()).toBe(false));
  fixture.detectChanges();
  return { page, fixture, api };
}
describe('Auditoria', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });
  it('lista registros com paginação', async () => {
    const { page, api, fixture } = await setup();
    expect(api.listar).toHaveBeenCalledWith({ page: 1, limit: 20 });
    expect(fixture.nativeElement.textContent).toContain('admin');
    page.irPara(2);
    await vi.waitFor(() => expect(page.loading()).toBe(false));
    expect(api.listar).toHaveBeenLastCalledWith({ page: 2, limit: 20 });
  });
  it('aplica filtros suportados pela API e volta à primeira página', async () => {
    const { page, api } = await setup();
    page.page.set(2);
    page.form.patchValue({ entidade: ' DOADOR ', entidadeId: '4', dataInicio: '2026-09-01' });
    page.filtrar();
    await vi.waitFor(() => expect(page.loading()).toBe(false));
    expect(api.listar).toHaveBeenLastCalledWith({
      page: 1,
      limit: 20,
      entidade: 'DOADOR',
      entidadeId: '4',
      dataInicio: '2026-09-01',
      usuarioId: undefined,
      operacao: undefined,
      dataFim: undefined,
    });
  });
  it('rejeita IDs não numéricos e período invertido sem consultar', async () => {
    const { page, api } = await setup();
    page.form.patchValue({ usuarioId: 'abc' });
    page.filtrar();
    expect(page.filtroError()).not.toBe('');
    page.form.patchValue({ usuarioId: '', dataInicio: '2026-09-10', dataFim: '2026-09-01' });
    page.filtrar();
    expect(page.filtroError()).toContain('data inicial');
    expect(api.listar).toHaveBeenCalledOnce();
  });
  it('abre e fecha o detalhe do registro', async () => {
    const { page, api, fixture } = await setup();
    await page.abrirDetalhe('10');
    expect(api.obter).toHaveBeenCalledWith('10');
    expect(page.detalhe()?.estadoNovo).toEqual({ nome: 'Ana' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Estado novo');
    await page.abrirDetalhe('10');
    expect(page.detalheId()).toBeNull();
  });
  it('exibe erro e permite nova consulta', async () => {
    const { page, api } = await setup();
    api.listar.mockReturnValueOnce(throwError(() => new Error('falha')));
    await page.carregar();
    expect(page.error()).not.toBe('');
    await page.carregar();
    expect(page.error()).toBe('');
  });
});
