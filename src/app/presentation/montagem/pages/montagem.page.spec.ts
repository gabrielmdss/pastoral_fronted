import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as U from '../../../application/montagem/montagem.use-cases';
import { MONTAGEM_API } from '../../../application/montagem/montagem-api.port';
import {
  ListarPlanejamentosUseCase,
  ObterPlanejamentoUseCase,
} from '../../../application/planejamento/planejamento.use-cases';
import { ListarInsumosUseCase } from '../../../application/estoque/estoque.use-cases';
import type { PlanejamentoDetalhe } from '../../../domain/planejamento/planejamento.model';
import type { LoteMontagem } from '../../../domain/montagem/montagem.model';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import Page from './montagem.page';
const lote: LoteMontagem = {
  id: '9',
  quantidadeMontada: 20,
  quantidadeDisponivel: 11,
  status: 'ATIVO',
  possuiAjustes: false,
  permiteDesmontagemParcial: true,
  podeAjustar: false,
  podeDesmontar: true,
  montadoEm: '2026-09-06T12:00:00Z',
  planejamento: { id: '2', versaoId: '4', numeroVersao: 3 },
  responsavel: { id: '1', login: 'operador' },
  itens: [{ apresentacaoInsumoId: '6', quantidadePorCesta: 2, quantidadeTotal: 40 }],
};
const plano: PlanejamentoDetalhe = {
  id: '2',
  competenciaId: '1',
  ano: 2026,
  mes: 9,
  modeloCestaId: '3',
  modelo: 'Regular',
  criadoEm: '2026-09-01',
  versoes: [
    {
      id: '4',
      numeroVersao: 3,
      quantidadePlanejada: 30,
      status: 'APROVADA',
      usuarioAprovadorId: '1',
      aprovadoEm: '2026-09-05',
      motivoRevisao: null,
      itens: [],
    },
  ],
};
async function setup(id: string | null = null, allowed = true) {
  const response = new Subject<{ id: string }>();
  const api = {
    listar: vi.fn(() => of([lote])),
    obter: vi.fn(() => of<LoteMontagem | null>(lote)),
    montar: vi.fn(() => response),
    ajustar: vi.fn(),
    desmontar: vi.fn(),
  };
  const estoque = {
    execute: vi.fn(() =>
      of([
        {
          apresentacaoId: '6',
          insumoId: '1',
          insumo: 'Arroz',
          apresentacao: '1 kg',
          categoria: null,
          quantidadeReferencia: 1,
          unidadeMedida: 'kg',
          saldoFisico: 17,
          saldoReservado: 7,
          saldoDisponivel: 10,
        },
      ]),
    ),
  };
  const planoUC = { execute: vi.fn(() => of<PlanejamentoDetalhe | null>(plano)) };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      ...Object.values(U),
      { provide: MONTAGEM_API, useValue: api },
      { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap(id ? { id } : {})) } },
      { provide: ListarPlanejamentosUseCase, useValue: { execute: () => of([plano]) } },
      { provide: ObterPlanejamentoUseCase, useValue: planoUC },
      { provide: ListarInsumosUseCase, useValue: estoque },
      {
        provide: SessionFacade,
        useValue: { hasPermission: (p: string) => p === 'ESTOQUE_VISUALIZAR' || allowed },
      },
    ],
  });
  const fixture = TestBed.createComponent(Page),
    page = fixture.componentInstance;
  await vi.waitFor(() => expect(page.loading()).toBe(false));
  const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  return { fixture, page, api, estoque, planoUC, response, navigate };
}
async function fill(page: Page) {
  page.form.controls.planejamentoId.setValue('2');
  await vi.waitFor(() => expect(page.planLoading()).toBe(false));
  page.form.patchValue({ planejamentoVersaoId: '4', quantidade: 5 });
}
describe('Montagem: páginas', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });
  it('lista com descrições reais e link ao lote', async () => {
    const { fixture } = await setup();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Regular');
    expect(fixture.nativeElement.querySelector('a[href="/montagem/9"]')).toBeTruthy();
  });
  it('vazio e retry com consulta nova', async () => {
    const { page, api, fixture } = await setup();
    api.listar.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 500 })));
    await page.carregar();
    expect(page.error()).toBeTruthy();
    api.listar.mockReturnValue(of([]));
    await page.carregar();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nenhum lote');
    expect(api.listar).toHaveBeenCalledTimes(3);
  });
  it('detalhe mostra composição e saldos sem recalcular', async () => {
    const { page, fixture, api } = await setup('9');
    fixture.detectChanges();
    expect(page.lote()).toEqual(lote);
    expect(fixture.nativeElement.textContent).toContain('Arroz');
    expect(fixture.nativeElement.textContent).toContain('operador');
    expect(api.obter).toHaveBeenCalledWith('9');
  });
  it('data null recebe mensagem de lote não encontrado', async () => {
    const { page, api } = await setup('99');
    api.obter.mockReturnValue(of(null));
    await page.carregar();
    expect(page.error()).toContain('não encontrado');
  });
  it('só versões aprovadas são oferecidas; backend permanece autoridade', async () => {
    const { page, planoUC, api } = await setup();
    planoUC.execute.mockReturnValue(
      of({ ...plano, versoes: [{ ...plano.versoes[0]!, status: 'SIMULACAO' }] }),
    );
    await fill(page);
    expect(page.aprovadas()).toEqual([]);
    await page.montar();
    expect(api.montar).not.toHaveBeenCalled();
  });
  it('sem CESTA_MONTAR não envia e não apresenta formulário', async () => {
    const { page, fixture, api } = await setup(null, false);
    await fill(page);
    await page.montar();
    fixture.detectChanges();
    expect(api.montar).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).not.toContain('Montar novo lote');
  });
  it.each([0, -1, 1.5])('não envia quantidade inválida %s', async (quantidade) => {
    const { page, api } = await setup();
    await fill(page);
    page.form.controls.quantidade.setValue(quantidade);
    await page.montar();
    expect(api.montar).not.toHaveBeenCalled();
  });
  it('cancelar confirmação não monta', async () => {
    const { page, api } = await setup();
    await fill(page);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    await page.montar();
    expect(api.montar).not.toHaveBeenCalled();
  });
  it('bloqueia duplo envio e atualiza lotes/estoque após sucesso antes de navegar', async () => {
    const { page, api, response, estoque, navigate } = await setup();
    await fill(page);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const pending = page.montar();
    await page.montar();
    expect(api.montar).toHaveBeenCalledExactlyOnceWith({
      planejamentoVersaoId: '4',
      quantidade: 5,
    });
    expect(navigate).not.toHaveBeenCalled();
    response.next({ id: '10' });
    response.complete();
    await pending;
    expect(api.listar).toHaveBeenCalledTimes(2);
    expect(estoque.execute).toHaveBeenCalledTimes(2);
    expect(navigate).toHaveBeenCalledWith(['/montagem', '10'], { state: { montado: true } });
    expect(page.saving()).toBe(false);
  });
  it('409 reconsulta lote/estoque/planejamento e não assume sucesso', async () => {
    const { page, api, response, estoque, planoUC, navigate } = await setup();
    await fill(page);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const pending = page.montar();
    response.error(
      new HttpErrorResponse({
        status: 409,
        error: { error: { code: 'SALDO_INSUFICIENTE', message: 'SQL privado' } },
      }),
    );
    await pending;
    expect(page.mutationError()).toContain('outra operação');
    expect(page.mutationError()).not.toContain('SQL');
    expect(estoque.execute).toHaveBeenCalledTimes(2);
    expect(api.listar).toHaveBeenCalledTimes(2);
    expect(planoUC.execute).toHaveBeenCalledTimes(2);
    expect(navigate).not.toHaveBeenCalled();
    expect(page.form.controls.planejamentoVersaoId.value).toBe('');
  });
  it('resposta antiga de planejamento não substitui nova seleção', async () => {
    const { page, planoUC } = await setup();
    const old = new Subject<PlanejamentoDetalhe | null>();
    planoUC.execute.mockReturnValueOnce(old);
    page.form.controls.planejamentoId.setValue('2');
    page.form.controls.planejamentoId.setValue('3');
    await vi.waitFor(() => expect(page.planLoading()).toBe(false));
    old.next(null);
    old.complete();
    await Promise.resolve();
    expect(page.plano()).toEqual(plano);
  });
  it('ações seguem flags reais do backend e permissões', async () => {
    const { fixture, page } = await setup('9');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-action="ajustar"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-action="desmontar"]')).toBeTruthy();
    page.lote.set({ ...lote, podeAjustar: true, quantidadeDisponivel: 20 });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-action="ajustar"]')).toBeTruthy();
    page.lote.set({
      ...lote,
      status: 'DESMONTADO',
      podeAjustar: false,
      podeDesmontar: false,
      quantidadeMontada: 0,
      quantidadeDisponivel: 0,
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-action]')).toBeNull();
  });
  it('sem permissões não oferece nem envia ajuste ou desmontagem', async () => {
    const { fixture, page, api } = await setup('9', false);
    page.lote.set({ ...lote, podeAjustar: true });
    page.abrirAcao('ajuste');
    await page.confirmarAcao();
    page.abrirAcao('desmontagem');
    await page.confirmarAcao();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-action]')).toBeNull();
    expect(api.ajustar).not.toHaveBeenCalled();
    expect(api.desmontar).not.toHaveBeenCalled();
  });
  it('lote ajustado mostra total informado e só oferece desmontagem integral', async () => {
    const { fixture, page, api } = await setup('9');
    page.lote.set({
      ...lote,
      quantidadeDisponivel: 20,
      possuiAjustes: true,
      permiteDesmontagemParcial: false,
      itens: [{ apresentacaoInsumoId: '6', quantidadePorCesta: 1.95, quantidadeTotal: 39 }],
    });
    page.abrirAcao('desmontagem');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('39');
    expect(fixture.nativeElement.textContent).toContain('Desmontagem integral: 20 cestas');
    expect(fixture.nativeElement.querySelector('input[formControlName="quantidade"]')).toBeNull();
    page.desmontagemForm.patchValue({ quantidade: 1, motivo: 'Conferência' });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    api.desmontar.mockReturnValue(of(undefined));
    await page.confirmarAcao();
    expect(api.desmontar).toHaveBeenCalledExactlyOnceWith('9', {
      quantidade: 20,
      motivo: 'Conferência',
    });
  });
  it('lote nunca ajustado envia a quantidade parcial escolhida e atualiza consulta', async () => {
    const { page, api, estoque, fixture } = await setup('9');
    page.abrirAcao('desmontagem');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input[formControlName="quantidade"]')).toBeTruthy();
    page.desmontagemForm.patchValue({ quantidade: 3, motivo: 'Conferência' });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    api.desmontar.mockReturnValue(of(undefined));
    await page.confirmarAcao();
    expect(api.desmontar).toHaveBeenCalledExactlyOnceWith('9', {
      quantidade: 3,
      motivo: 'Conferência',
    });
    expect(api.obter).toHaveBeenCalledTimes(2);
    expect(estoque.execute).toHaveBeenCalledTimes(2);
    expect(page.feedback()).toContain('confirmada');
  });
  it('cancelamento da confirmação não envia nenhuma mutação', async () => {
    const { page, api } = await setup('9');
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    page.abrirAcao('desmontagem');
    page.desmontagemForm.patchValue({ quantidade: 3, motivo: 'Conferência' });
    await page.confirmarAcao();
    page.lote.set({ ...lote, podeAjustar: true, quantidadeDisponivel: 20 });
    page.abrirAcao('ajuste');
    page.ajusteForm.patchValue({ motivo: 'Conferência', itens: [{ apresentacaoInsumoId: '6' }] });
    await page.confirmarAcao();
    expect(api.desmontar).not.toHaveBeenCalled();
    expect(api.ajustar).not.toHaveBeenCalled();
  });
  it('ajuste preserva itens e quantidades do contrato, loading e proteção de duplo envio', async () => {
    const { page, api, estoque, fixture } = await setup('9');
    page.lote.set({ ...lote, podeAjustar: true, quantidadeDisponivel: 20 });
    page.abrirAcao('ajuste');
    page.adicionarItemAjuste();
    const input = {
      quantidadeCestasAfetadas: 2,
      motivo: 'Conferência',
      itens: [
        { apresentacaoInsumoId: '6', operacao: 'REMOVER' as const, quantidadePorCesta: 1 },
        { apresentacaoInsumoId: '7', operacao: 'ADICIONAR' as const, quantidadePorCesta: 2 },
      ],
    };
    page.ajusteForm.setValue(input);
    const response = new Subject<{ id: string }>();
    api.ajustar.mockReturnValue(response);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const pending = page.confirmarAcao();
    await page.confirmarAcao();
    fixture.detectChanges();
    expect(page.saving()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Ajustando…');
    expect(api.ajustar).toHaveBeenCalledExactlyOnceWith('9', input);
    response.next({ id: '12' });
    response.complete();
    await pending;
    expect(page.saving()).toBe(false);
    expect(page.acao()).toBeNull();
    expect(api.obter).toHaveBeenCalledTimes(2);
    expect(estoque.execute).toHaveBeenCalledTimes(2);
  });
  it('desmontagem bloqueia duplo envio durante a chamada', async () => {
    const { page, api } = await setup('9');
    page.abrirAcao('desmontagem');
    page.desmontagemForm.patchValue({ quantidade: 3, motivo: 'Conferência' });
    const response = new Subject<void>();
    api.desmontar.mockReturnValue(response);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const pending = page.confirmarAcao();
    await page.confirmarAcao();
    expect(page.saving()).toBe(true);
    expect(api.desmontar).toHaveBeenCalledTimes(1);
    response.next();
    response.complete();
    await pending;
    expect(page.saving()).toBe(false);
  });
  it('novo conflito 409 informa integral, preserva motivo e reconsulta flags/composição', async () => {
    const { page, api, estoque } = await setup('9');
    page.abrirAcao('desmontagem');
    page.desmontagemForm.patchValue({ quantidade: 3, motivo: 'Conferência' });
    api.desmontar.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { error: { code: 'LOTE_AJUSTADO_DESMONTAGEM_PARCIAL', message: 'SQL privado' } },
          }),
      ),
    );
    api.obter.mockReturnValue(
      of({ ...lote, possuiAjustes: true, permiteDesmontagemParcial: false, podeDesmontar: false }),
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await page.confirmarAcao();
    expect(page.mutationError()).toContain('só pode ser desmontado integralmente');
    expect(page.mutationError()).not.toContain('SQL');
    expect(page.desmontagemForm.controls.motivo.value).toBe('Conferência');
    expect(api.obter).toHaveBeenCalledTimes(2);
    expect(estoque.execute).toHaveBeenCalledTimes(2);
    expect(page.podeDesmontar()).toBe(false);
    expect(page.feedback()).toBe('');
  });
  it('ajuste em conflito preserva formulário e reconsulta o estado', async () => {
    const { page, api, estoque } = await setup('9');
    page.lote.set({ ...lote, podeAjustar: true, quantidadeDisponivel: 20 });
    page.abrirAcao('ajuste');
    page.ajusteForm.patchValue({ motivo: 'Conferência', itens: [{ apresentacaoInsumoId: '6' }] });
    const before = page.ajusteForm.getRawValue();
    api.ajustar.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { error: { code: 'SALDO_INSUFICIENTE', message: 'SQL privado' } },
          }),
      ),
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await page.confirmarAcao();
    expect(page.ajusteForm.getRawValue()).toEqual(before);
    expect(page.mutationError()).toContain('insuficiente');
    expect(page.mutationError()).not.toContain('SQL');
    expect(estoque.execute).toHaveBeenCalledTimes(2);
    expect(page.saving()).toBe(false);
  });
  it.each([0, -1, 1.5])(
    'ajuste e desmontagem não enviam quantidade inválida %s',
    async (quantidade) => {
      const { page, api } = await setup('9');
      page.abrirAcao('desmontagem');
      page.desmontagemForm.patchValue({ quantidade, motivo: 'Conferência' });
      await page.confirmarAcao();
      page.lote.set({ ...lote, podeAjustar: true, quantidadeDisponivel: 20 });
      page.abrirAcao('ajuste');
      page.ajusteForm.patchValue({
        quantidadeCestasAfetadas: quantidade,
        motivo: 'Conferência',
        itens: [{ apresentacaoInsumoId: '6' }],
      });
      await page.confirmarAcao();
      expect(api.ajustar).not.toHaveBeenCalled();
      expect(api.desmontar).not.toHaveBeenCalled();
    },
  );
});
