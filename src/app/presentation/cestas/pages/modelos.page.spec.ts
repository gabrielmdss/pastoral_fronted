import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of, Subject } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as U from '../../../application/cestas/modelos.use-cases';
import { MODELOS_API } from '../../../application/cestas/modelos-api.port';
import { ListarInsumosUseCase } from '../../../application/estoque/estoque.use-cases';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import { APP_CONFIG } from '../../../infrastructure/config/app-config';
import { ModelosApiService } from '../../../infrastructure/api/cestas/modelos-api.service';
import ModelosPage from './modelos.page';
const modelo = {
  id: '1',
  nome: 'Regular',
  tipo: 'REGULAR' as const,
  ativo: true,
  criadoEm: '2026-09-01',
  versoes: [],
};
async function setup(allowed = true) {
  const result = new Subject<{ id: string; numeroVersao: number }>();
  const api = {
    listar: vi.fn(() => of([modelo])),
    obter: vi.fn(() => of(modelo)),
    criar: vi.fn(() => result),
    versao: vi.fn(() => result),
  };
  TestBed.configureTestingModule({
    providers: [
      ...Object.values(U),
      { provide: MODELOS_API, useValue: api },
      { provide: ListarInsumosUseCase, useValue: { execute: () => of([]) } },
      { provide: SessionFacade, useValue: { hasPermission: () => allowed } },
    ],
  });
  const fixture = TestBed.createComponent(ModelosPage),
    page = fixture.componentInstance;
  await vi.waitFor(() => expect(page.loading()).toBe(false));
  return { fixture, page, api, result };
}
describe('Modelos e versões', () => {
  afterEach(() => TestBed.resetTestingModule());
  it.each(['modelo', 'versao'] as const)('salva %s e recarrega sem duplo envio', async (kind) => {
    const { page, api, result } = await setup();
    await page.selecionar('1');
    page.novo.patchValue({ nome: 'Regular' });
    page.versao.controls.itens.at(0).patchValue({ apresentacaoInsumoId: '8' });
    const pending = page.salvar(kind);
    await page.salvar(kind);
    expect(kind === 'modelo' ? api.criar : api.versao).toHaveBeenCalledOnce();
    result.next({ id: '1', numeroVersao: 2 });
    result.complete();
    await pending;
    expect(page.saving()).toBe(false);
    expect(api.obter).toHaveBeenCalledTimes(2);
  });
  it('não envia sem permission ou com quantidade inválida', async () => {
    const { page, api } = await setup(false);
    page.novo.patchValue({ nome: 'Regular' });
    await page.salvar('modelo');
    expect(api.criar).not.toHaveBeenCalled();
  });
  it('erro de meta não limpa a composição', async () => {
    const { page, result } = await setup();
    await page.selecionar('1');
    page.versao.controls.itens.at(0).patchValue({ apresentacaoInsumoId: '8' });
    const pending = page.salvar('versao');
    result.error(
      new HttpErrorResponse({
        status: 409,
        error: { error: { code: 'META_ITENS_INCONSISTENTE' } },
      }),
    );
    await pending;
    expect(page.mutationError()).toContain('meta');
    expect(page.versao.controls.itens.at(0).value.apresentacaoInsumoId).toBe('8');
    expect(page.saving()).toBe(false);
  });
  it('usa somente endpoints e payloads reais; preserva composição do detalhe', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ModelosApiService,
        { provide: APP_CONFIG, useValue: { apiBaseUrl: '/api' } },
      ],
    });
    const api = TestBed.inject(ModelosApiService),
      http = TestBed.inject(HttpTestingController);
    api.listar().subscribe((x) => expect(x[0]?.nome).toBe('Regular'));
    http.expectOne('/api/cestas/modelos').flush({ data: [modelo] });
    api.criar({ nome: 'Regular', tipo: 'REGULAR' }).subscribe();
    const c = http.expectOne('/api/cestas/modelos');
    expect(c.request.body).toEqual({ nome: 'Regular', tipo: 'REGULAR' });
    c.flush({ data: { id: '1' } });
    const input = { metaItens: 1, itens: [{ apresentacaoInsumoId: '8', quantidade: 1 }] };
    api.versao('1', input).subscribe();
    const v = http.expectOne('/api/cestas/modelos/1/versoes');
    expect(v.request.body).toEqual(input);
    v.flush({ data: { id: '2', numeroVersao: 1 } });
    const detalhe = {
      ...modelo,
      versoes: [
        {
          ...input,
          id: '2',
          numeroVersao: 1,
          usuarioId: '1',
          criadoEm: '2026-09-01',
          itens: [{ ...input.itens[0], insumo: 'Arroz', apresentacao: '1 kg' }],
        },
      ],
    };
    api.obter('1').subscribe((x) => expect(x).toEqual(detalhe));
    http.expectOne('/api/cestas/modelos/1').flush({ data: detalhe });
    http.verify();
  });
});
