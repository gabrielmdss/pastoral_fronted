import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ESTOQUE_API } from '../../../application/estoque/estoque-api.port';
import * as U from '../../../application/estoque/estoque.use-cases';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import EstoquePage from './estoque.page';
async function setup(allowed = true) {
  const result = new Subject<{ id: string }>();
  const api = {
    listar: vi.fn(() => of([])),
    categorias: vi.fn(() => of([])),
    doadores: vi.fn(() => of([])),
    entrada: vi.fn(() => result),
    perda: vi.fn(() => result),
    cadastrar: vi.fn(() => result),
    criarDoador: vi.fn(() => result),
    atualizarDoador: vi.fn(() => result),
  };
  TestBed.configureTestingModule({
    providers: [
      ...Object.values(U),
      { provide: ESTOQUE_API, useValue: api },
      { provide: SessionFacade, useValue: { hasPermission: () => allowed } },
    ],
  });
  const fixture = TestBed.createComponent(EstoquePage);
  const page = fixture.componentInstance;
  await vi.waitFor(() => expect(page.loading()).toBe(false));
  fixture.detectChanges();
  return { page, fixture, api, result };
}
describe('Estoque operacional', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });
  it.each(['entrada', 'perda'] as const)('registra %s e atualiza sem duplicar', async (mode) => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { page, api, result } = await setup();
    page.abrir(mode);
    page.entrada.controls.itens.at(0).patchValue({ apresentacaoInsumoId: '8', quantidade: 2 });
    page.perda.patchValue({ apresentacaoInsumoId: '8', motivoId: '3', quantidade: 1 });
    const saving = page.salvar();
    await page.salvar();
    expect(api[mode]).toHaveBeenCalledOnce();
    expect(page.saving()).toBe(true);
    result.next({ id: '1' });
    result.complete();
    await saving;
    expect(api.listar).toHaveBeenCalledTimes(2);
    expect(page.saving()).toBe(false);
    expect(page.mode()).toBeNull();
  });
  it('bloqueia comandos sem permission', async () => {
    const { page, api, fixture } = await setup(false);
    page.abrir('entrada');
    page.entrada.controls.itens.at(0).patchValue({ apresentacaoInsumoId: '8' });
    await page.salvar();
    expect(api.entrada).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).not.toContain('Registrar entrada');
  });
  it('valida quantidade inteira e motivo obrigatório', async () => {
    const { page, api } = await setup();
    page.abrir('entrada');
    page.entrada.controls.itens.at(0).patchValue({ apresentacaoInsumoId: '8', quantidade: 1.5 });
    await page.salvar();
    expect(api.entrada).not.toHaveBeenCalled();
    page.abrir('perda');
    await page.salvar();
    expect(api.perda).not.toHaveBeenCalled();
  });
  it('conflito preserva dados, libera envio e reconsulta', async () => {
    const { page, api, result } = await setup();
    page.abrir('entrada');
    page.entrada.controls.itens.at(0).patchValue({ apresentacaoInsumoId: '8' });
    const pending = page.salvar();
    result.error(
      new HttpErrorResponse({ status: 409, error: { error: { code: 'SALDO_INSUFICIENTE' } } }),
    );
    await pending;
    expect(page.mutationError()).toContain('insuficiente');
    expect(page.saving()).toBe(false);
    expect(page.mode()).toBe('entrada');
    expect(api.listar).toHaveBeenCalledTimes(2);
  });
  it('retry executa nova consulta', async () => {
    const { page, api } = await setup();
    api.listar.mockReturnValueOnce(throwError(() => new Error('falha')));
    await page.carregar();
    expect(page.error()).not.toBe('');
    await page.carregar();
    expect(page.error()).toBe('');
  });
  it.each(['insumo', 'doador'] as const)('cadastro %s recarrega catálogos', async (mode) => {
    const { page, api, result } = await setup();
    page.abrir(mode);
    page.insumo.patchValue({ nome: 'Arroz', descricao: '1 kg' });
    page.doador.patchValue({ nome: 'Ana' });
    const pending = page.salvar();
    result.next({ id: '4' });
    result.complete();
    await pending;
    expect(mode === 'insumo' ? api.cadastrar : api.criarDoador).toHaveBeenCalledOnce();
    expect(api.doadores).toHaveBeenCalledTimes(2);
  });
});
