import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ESTOQUE_API } from '../../../application/estoque/estoque-api.port';
import * as U from '../../../application/estoque/estoque.use-cases';
import type { Doador } from '../../../domain/estoque/estoque.model';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import DoadoresPage from './doadores.page';
const doadores: Doador[] = [
  { id: '1', tipo: 'PESSOA', nome: 'Ana', telefone: '1199', observacao: null, ativo: true, criadoEm: '' },
  { id: '2', tipo: 'INSTITUICAO', nome: 'Mercado Central', telefone: null, observacao: null, ativo: false, criadoEm: '' },
];
async function setup(allowed = true) {
  const result = new Subject<unknown>();
  const api = {
    doadores: vi.fn(() => of(doadores)),
    criarDoador: vi.fn(() => result),
    atualizarDoador: vi.fn(() => result),
  };
  const perms = signal(allowed);
  TestBed.configureTestingModule({
    providers: [
      ...Object.values(U),
      { provide: ESTOQUE_API, useValue: api },
      { provide: SessionFacade, useValue: { hasPermission: () => perms() } },
    ],
  });
  const fixture = TestBed.createComponent(DoadoresPage);
  const page = fixture.componentInstance;
  await vi.waitFor(() => expect(page.loading()).toBe(false));
  fixture.detectChanges();
  return { page, fixture, api, result };
}
describe('Doadores', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });
  it('lista e filtra por busca, tipo e status', async () => {
    const { page, fixture } = await setup();
    expect(fixture.nativeElement.textContent).toContain('Mercado Central');
    page.busca.set('ana');
    expect(page.filtrados().map((d) => d.id)).toEqual(['1']);
    page.busca.set('');
    page.filtroTipo.set('INSTITUICAO');
    expect(page.filtrados().map((d) => d.id)).toEqual(['2']);
    page.filtroTipo.set('');
    page.filtroStatus.set('ATIVO');
    expect(page.filtrados().map((d) => d.id)).toEqual(['1']);
  });
  it('cadastra doador sem duplicar envio e recarrega', async () => {
    const { page, api, result } = await setup();
    page.abrir();
    page.form.patchValue({ nome: ' Bia ', telefone: '' });
    const pending = page.salvar();
    await page.salvar();
    expect(api.criarDoador).toHaveBeenCalledOnce();
    expect(api.criarDoador).toHaveBeenCalledWith({
      tipo: 'PESSOA',
      nome: 'Bia',
      telefone: null,
      observacao: null,
    });
    result.next({ id: '3' });
    result.complete();
    await pending;
    expect(api.doadores).toHaveBeenCalledTimes(2);
    expect(page.formAberto()).toBe(false);
    expect(page.feedback()).toContain('cadastrado');
  });
  it('edita doador enviando status ativo', async () => {
    const { page, api, result } = await setup();
    page.abrir(doadores[1]);
    page.form.patchValue({ ativo: true });
    const pending = page.salvar();
    result.next(undefined);
    result.complete();
    await pending;
    expect(api.atualizarDoador).toHaveBeenCalledWith('2', {
      tipo: 'INSTITUICAO',
      nome: 'Mercado Central',
      telefone: null,
      observacao: null,
      ativo: true,
    });
  });
  it('sem ESTOQUE_ENTRADA não exibe nem executa cadastro/edição', async () => {
    const { page, api, fixture } = await setup(false);
    expect(fixture.nativeElement.textContent).not.toContain('Cadastrar doador');
    expect(fixture.nativeElement.textContent).not.toContain('Editar');
    page.abrir();
    expect(page.formAberto()).toBe(false);
    page.form.patchValue({ nome: 'X' });
    await page.salvar();
    expect(api.criarDoador).not.toHaveBeenCalled();
  });
  it('erro de mutação preserva formulário', async () => {
    const { page, result } = await setup();
    page.abrir(doadores[0]);
    const pending = page.salvar();
    result.error(
      new HttpErrorResponse({ status: 404, error: { error: { code: 'DOADOR_NAO_ENCONTRADO' } } }),
    );
    await pending;
    expect(page.mutationError()).toContain('Doador não encontrado');
    expect(page.formAberto()).toBe(true);
    expect(page.saving()).toBe(false);
  });
  it('erro de consulta permite nova tentativa', async () => {
    const { page, api } = await setup();
    api.doadores.mockReturnValueOnce(throwError(() => new Error('falha')));
    await page.carregar();
    expect(page.error()).not.toBe('');
    await page.carregar();
    expect(page.error()).toBe('');
  });
});
