import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
  Router,
  type CanActivateFn,
} from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ListarLiberacoesUseCase,
  LiberarCestasUseCase,
} from '../../../application/liberacoes/liberacoes.use-cases';
import { LIBERACOES_API } from '../../../application/liberacoes/liberacoes-api.port';
import { ObterDistribuicaoUseCase } from '../../../application/distribuicoes/obter-distribuicao.use-case';
import { AbrirDistribuicaoUseCase } from '../../../application/distribuicoes/abrir-distribuicao.use-case';
import { EncerrarDistribuicaoUseCase } from '../../../application/distribuicoes/encerrar-distribuicao.use-case';
import { RemarcarDistribuicaoUseCase } from '../../../application/distribuicoes/remarcar-distribuicao.use-case';
import { ListarLotesUseCase } from '../../../application/montagem/montagem.use-cases';
import { ListarPlanejamentosUseCase } from '../../../application/planejamento/planejamento.use-cases';
import type { LoteMontagem } from '../../../domain/montagem/montagem.model';
import type { Distribuicao } from '../../../domain/distribuicoes/distribuicao.model';
import type { LiberacaoCestas } from '../../../domain/liberacoes/liberacao.model';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import { appRoutes } from '../../../main/app.routes';
import DetailPage from '../../distribuicoes/pages/distribuicao-detail.page';
import Page from './liberacoes.page';
const d: Distribuicao = {
  id: '3',
  status: 'PLANEJADA',
  dataPrevista: '2026-09-12',
  dataReal: null,
  competencia: { id: '1', ano: 2026, mes: 9 },
  grupo: { id: '2', nome: 'Grupo A', codigo: 'A' },
  previstos: 10,
  checkIns: 0,
  regularesPresentes: 0,
  pendentesPresentes: 0,
  retiradas: 0,
  ausentes: 0,
  naoAtendidosEstoque: 0,
  naoAtendidosIrregularidade: 0,
  cestasLiberadas: 0,
  cestasConsumidas: 0,
  cestasRetornadas: 0,
  cestasDisponiveis: 0,
};
const lote: LoteMontagem = {
  id: '2',
  quantidadeMontada: 10,
  quantidadeDisponivel: 7,
  status: 'ATIVO',
  possuiAjustes: true,
  permiteDesmontagemParcial: false,
  podeAjustar: false,
  podeDesmontar: false,
  montadoEm: '2026-09-07T12:00:00Z',
  planejamento: { id: '4', versaoId: '5', numeroVersao: 2 },
  responsavel: { id: '8', login: 'operador' },
  itens: [{ apresentacaoInsumoId: '1', quantidadePorCesta: 0.3, quantidadeTotal: 3 }],
};
const release: LiberacaoCestas = {
  id: '9',
  loteMontagemId: '2',
  quantidadeLiberada: 3,
  quantidadeConsumida: 0,
  quantidadeRetornada: 0,
  quantidadeDisponivel: 3,
  usuarioId: '8',
  liberadoEm: '2026-09-07T12:00:00Z',
};
async function setup(
  permissions = [
    'BENEFICIARIO_VISUALIZAR',
    'ESTOQUE_VISUALIZAR',
    'CESTA_LIBERAR_DISTRIBUICAO',
    'DISTRIBUICAO_TRIAGEM',
  ],
) {
  const response = new Subject<{ id: string }>();
  const api = {
    listar: vi.fn(() => of<LiberacaoCestas[]>([])),
    liberar: vi.fn(() => response.asObservable()),
  };
  const obter = { execute: vi.fn(() => of(d)) };
  const lotes = { execute: vi.fn(() => of([lote])) };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      ListarLiberacoesUseCase,
      LiberarCestasUseCase,
      { provide: LIBERACOES_API, useValue: api },
      {
        provide: ActivatedRoute,
        useValue: {
          paramMap: of(convertToParamMap({ id: '3' })),
          snapshot: { paramMap: convertToParamMap({ id: '3' }) },
        },
      },
      { provide: ObterDistribuicaoUseCase, useValue: obter },
      { provide: ListarLotesUseCase, useValue: lotes },
      {
        provide: ListarPlanejamentosUseCase,
        useValue: { execute: () => of([{ id: '4', modelo: 'Regular', mes: 9, ano: 2026 }]) },
      },
      {
        provide: SessionFacade,
        useValue: { hasPermission: (p: string) => permissions.includes(p) },
      },
      ...[AbrirDistribuicaoUseCase, EncerrarDistribuicaoUseCase, RemarcarDistribuicaoUseCase].map(
        (provide) => ({ provide, useValue: { execute: vi.fn() } }),
      ),
    ],
  });
  const fixture = TestBed.createComponent(Page),
    page = fixture.componentInstance;
  await vi.waitFor(() => expect(page.loading()).toBe(false));
  return { fixture, page, api, obter, lotes, response };
}
describe('Liberações: fluxo frontend', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });
  it('consulta destino real, lote ajustado e vazio sem derivar quantidade da composição', async () => {
    const { fixture, page } = await setup();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Grupo A');
    expect(fixture.nativeElement.textContent).toContain('Regular');
    expect(fixture.nativeElement.textContent).toContain('7 disponíveis');
    expect(fixture.nativeElement.textContent).toContain('Nenhuma liberação');
    expect(page.utilizaveis()).toEqual([lote]);
  });
  it('erro e retry fazem nova consulta', async () => {
    const { page, api } = await setup();
    api.listar.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 500 })));
    await page.carregar();
    expect(page.error()).toBeTruthy();
    await page.carregar();
    expect(page.error()).toBe('');
    expect(api.listar).toHaveBeenCalledTimes(3);
  });
  it.each(['ESGOTADO', 'DESMONTADO'] as const)('não oferece lote %s', async (status) => {
    const { page, lotes, api } = await setup();
    lotes.execute.mockReturnValue(of([{ ...lote, status }]));
    await page.carregar();
    page.form.patchValue({ loteMontagemId: '2', quantidade: 1 });
    await page.liberar();
    expect(page.utilizaveis()).toEqual([]);
    expect(api.liberar).not.toHaveBeenCalled();
  });
  it('lote sem saldo não pode ser selecionado', async () => {
    const { page, lotes } = await setup();
    lotes.execute.mockReturnValue(of([{ ...lote, quantidadeDisponivel: 0 }]));
    await page.carregar();
    expect(page.utilizaveis()).toEqual([]);
  });
  it('somente consulta não envia nem exibe ação', async () => {
    const { page, fixture, api } = await setup(['BENEFICIARIO_VISUALIZAR', 'ESTOQUE_VISUALIZAR']);
    page.form.patchValue({ loteMontagemId: '2', quantidade: 1 });
    await page.liberar();
    fixture.detectChanges();
    expect(api.liberar).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });
  it.each([0, -1, 1.5])('rejeita quantidade inválida %s', async (quantidade) => {
    const { page, api } = await setup();
    page.form.patchValue({ loteMontagemId: '2', quantidade });
    await page.liberar();
    expect(api.liberar).not.toHaveBeenCalled();
  });
  it('confirma quantidade, modelo/lote e destino; cancelamento não envia', async () => {
    const { page, api } = await setup();
    page.form.patchValue({ loteMontagemId: '2', quantidade: 3 });
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await page.liberar();
    expect(confirm.mock.calls[0]?.[0]).toContain('3 cestas');
    expect(confirm.mock.calls[0]?.[0]).toContain('Lote 2 · Regular');
    expect(confirm.mock.calls[0]?.[0]).toContain('Grupo A · 9/2026 · 12/09/2026');
    expect(api.liberar).not.toHaveBeenCalled();
  });
  it('bloqueia duplicidade, espera HTTP e recarrega os totais reais em todas as consultas', async () => {
    const { page, api, obter, lotes, response, fixture } = await setup();
    page.form.patchValue({ loteMontagemId: '2', quantidade: 3 });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const pending = page.liberar();
    await page.liberar();
    expect(api.liberar).toHaveBeenCalledExactlyOnceWith('3', {
      loteMontagemId: '2',
      quantidade: 3,
    });
    expect(page.distribuicao()?.cestasDisponiveis).toBe(0);
    obter.execute.mockReturnValue(
      of({ ...d, status: 'ABERTA', cestasLiberadas: 3, cestasDisponiveis: 3 }),
    );
    api.listar.mockReturnValue(of([release]));
    lotes.execute.mockReturnValue(of([{ ...lote, quantidadeDisponivel: 4 }]));
    response.next({ id: '9' });
    response.complete();
    await pending;
    expect(obter.execute).toHaveBeenCalledTimes(2);
    expect(lotes.execute).toHaveBeenCalledTimes(2);
    expect(api.listar).toHaveBeenCalledTimes(2);
    expect(page.distribuicao()?.cestasDisponiveis).toBe(3);
    expect(page.lotes()[0]?.quantidadeDisponivel).toBe(4);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('a[href="/distribuicoes/3/atendimento"]'),
    ).toBeTruthy();
    const detail = TestBed.createComponent(DetailPage);
    detail.detectChanges();
    expect(detail.componentInstance.distribuicao()?.cestasDisponiveis).toBe(3);
  });
  it('liberações sucessivas preservam registros e acumulado retornado, sem somar localmente', async () => {
    const { page, api, obter } = await setup();
    api.liberar.mockReturnValue(of({ id: '10' }));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    api.listar.mockReturnValue(
      of([release, { ...release, id: '10', quantidadeLiberada: 2, quantidadeDisponivel: 2 }]),
    );
    obter.execute.mockReturnValue(
      of({ ...d, cestasLiberadas: 5, cestasDisponiveis: 4, cestasConsumidas: 1 }),
    );
    for (let i = 0; i < 2; i++) {
      page.form.patchValue({ loteMontagemId: '2', quantidade: 2 });
      await page.liberar();
    }
    expect(api.liberar).toHaveBeenCalledTimes(2);
    expect(page.liberacoes()).toHaveLength(2);
    expect(page.distribuicao()?.cestasDisponiveis).toBe(4);
  });
  it('409 atualiza lote e distribuição encerrada sem sucesso presumido', async () => {
    const { page, api, obter, lotes, response, fixture } = await setup();
    page.form.patchValue({ loteMontagemId: '2', quantidade: 3 });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const pending = page.liberar();
    obter.execute.mockReturnValue(of({ ...d, status: 'ENCERRADA', cestasRetornadas: 3 }));
    lotes.execute.mockReturnValue(of([{ ...lote, status: 'ESGOTADO', quantidadeDisponivel: 0 }]));
    response.error(
      new HttpErrorResponse({
        status: 409,
        error: { error: { code: 'DISTRIBUICAO_ENCERRADA', message: 'SQL privado' } },
      }),
    );
    await pending;
    expect(page.mutationError()).toContain('outra operação');
    expect(page.mutationError()).not.toContain('SQL');
    expect(page.feedback()).toBe('');
    expect(api.listar).toHaveBeenCalledTimes(2);
    expect(page.form.controls.loteMontagemId.value).toBe('');
    await page.liberar();
    expect(api.liberar).toHaveBeenCalledOnce();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });
  it.each(
    [
      [],
      ['BENEFICIARIO_VISUALIZAR'],
      ['ESTOQUE_VISUALIZAR'],
      ['BENEFICIARIO_VISUALIZAR', 'ESTOQUE_VISUALIZAR'],
    ].map((permissions) => ({ permissions })),
  )('rota e link usam as permissions dos contratos: %j', async ({ permissions }) => {
    await setup(permissions);
    const route = appRoutes
      .find((r) => r.children)
      ?.children?.find((r) => r.path === 'distribuicoes/:id/liberacoes');
    const results = route!.canActivate!.map((guard) =>
      TestBed.runInInjectionContext(() => (guard as CanActivateFn)({} as never, {} as never)),
    );
    expect(results.every((r) => r === true)).toBe(permissions.length === 2);
    for (const r of results.filter((r) => r !== true))
      expect(TestBed.inject(Router).serializeUrl(r as ReturnType<Router['createUrlTree']>)).toBe(
        '/acesso-negado',
      );
    const fixture = TestBed.createComponent(DetailPage);
    fixture.detectChanges();
    expect(!!fixture.nativeElement.querySelector('a[href="/distribuicoes/3/liberacoes"]')).toBe(
      permissions.includes('ESTOQUE_VISUALIZAR'),
    );
  });
});
