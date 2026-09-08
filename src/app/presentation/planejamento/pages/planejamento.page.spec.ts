import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as U from '../../../application/planejamento/planejamento.use-cases';
import { PLANEJAMENTO_API } from '../../../application/planejamento/planejamento-api.port';
import { ListarCompetenciasUseCase } from '../../../application/competencias/competencias.use-cases';
import {
  ListarModelosUseCase,
  ObterModeloUseCase,
} from '../../../application/cestas/modelos.use-cases';
import { ListarInsumosUseCase } from '../../../application/estoque/estoque.use-cases';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import type {
  PlanejamentoDetalhe,
  SimulacaoPlanejamento,
} from '../../../domain/planejamento/planejamento.model';
import DetailPage from './planejamento-detail.page';
import ListPage from './planejamentos-list.page';

const plan: PlanejamentoDetalhe = {
  id: '7',
  competenciaId: '2',
  ano: 2026,
  mes: 9,
  modeloCestaId: '3',
  modelo: 'Regular',
  criadoEm: '2026-09-01',
  versoes: [
    {
      id: '8',
      numeroVersao: 1,
      quantidadePlanejada: 12,
      status: 'SIMULACAO',
      usuarioAprovadorId: null,
      aprovadoEm: null,
      motivoRevisao: null,
      itens: [],
    },
  ],
};
const input = { competenciaId: '2', modeloCestaVersaoId: '4', quantidade: 12 };
const simulation: SimulacaoPlanejamento = {
  ...input,
  capacidadeMaxima: 3,
  cobertura: 0.25,
  itensLimitantes: ['5'],
  itens: [
    {
      apresentacaoInsumoId: '5',
      insumo: 'Arroz',
      apresentacao: '1 kg',
      quantidadePorCesta: 2,
      necessidade: 24,
      saldoFisico: 10,
      saldoReservado: 4,
      saldoDisponivel: 6,
      deficit: 18,
      capacidade: 3,
    },
  ],
};
async function setup(id: string | null = null, approve = true, catalogs = true) {
  const approval = new Subject<void>();
  const creation = new Subject<{ id: string; versaoId: string }>();
  const api = {
    listar: vi.fn(() => of([plan])),
    obter: vi.fn(() => of<PlanejamentoDetalhe | null>(plan)),
    simular: vi.fn(() => of(simulation)),
    criar: vi.fn(() => creation),
    revisar: vi.fn(() => of({ versaoId: '9' })),
    aprovar: vi.fn(() => approval),
  };
  const stock = { execute: vi.fn(() => of([])) };
  const modelos = { execute: vi.fn(() => of([])) };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      ...Object.values(U),
      { provide: PLANEJAMENTO_API, useValue: api },
      { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap(id ? { id } : {})) } },
      { provide: ListarCompetenciasUseCase, useValue: { execute: () => of([]) } },
      { provide: ListarModelosUseCase, useValue: modelos },
      { provide: ObterModeloUseCase, useValue: { execute: () => of({ versoes: [] }) } },
      { provide: ListarInsumosUseCase, useValue: stock },
      {
        provide: SessionFacade,
        useValue: {
          hasPermission: (p: string) =>
            p === 'ESTOQUE_VISUALIZAR' || (p === 'CESTA_PLANEJAMENTO_APROVAR' ? approve : catalogs),
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(DetailPage),
    page = fixture.componentInstance;
  await vi.waitFor(() => expect(page.loading()).toBe(false));
  const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  return { fixture, page, api, stock, modelos, approval, creation, navigate };
}
async function fill(page: DetailPage) {
  page.form.patchValue({ modeloId: '3' });
  await vi.waitFor(() => expect(page.modelLoading()).toBe(false));
  page.form.patchValue({ ...input, motivo: 'Ajustar demanda' });
}
describe('Planejamento: comportamento das páginas', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });
  it('lista, apresenta erro e retry executa nova consulta', async () => {
    const { api } = await setup();
    api.listar.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 500 })));
    const fixture = TestBed.createComponent(ListPage),
      page = fixture.componentInstance;
    expect(page.error()).toBeTruthy();
    page.carregar();
    expect(page.items()).toEqual([plan]);
    expect(api.listar).toHaveBeenCalledTimes(2);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Regular');
  });
  it('lista vazia possui feedback', async () => {
    const { api } = await setup();
    api.listar.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(ListPage);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nenhum');
  });
  it('consulta detalhe e saldos; data null recebe mensagem amigável', async () => {
    const { page, api, stock } = await setup('7');
    expect(page.detalhe()).toEqual(plan);
    expect(stock.execute).toHaveBeenCalledOnce();
    api.obter.mockReturnValue(of(null));
    await page.carregar();
    expect(page.error()).toContain('não encontrado');
  });
  it('exibe falta e valores da simulação sem recalcular', async () => {
    const { page, fixture, api } = await setup();
    await fill(page);
    await page.simular();
    expect(api.simular).toHaveBeenCalledWith(input);
    expect(page.simulacao()).toEqual(simulation);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Arroz');
    expect(fixture.nativeElement.textContent).toContain('Insuficiente');
  });
  it.each(['competenciaId', 'modeloCestaVersaoId', 'quantidade'] as const)(
    'alteração de %s invalida simulação e impede criação',
    async (field) => {
      const { page, api } = await setup();
      await fill(page);
      await page.simular();
      if (field === 'quantidade') page.form.controls.quantidade.setValue(13);
      else page.form.controls[field].setValue('99');
      expect(page.simulacao()).toBeNull();
      await page.salvar();
      expect(api.criar).not.toHaveBeenCalled();
    },
  );
  it('descarta simulação que chega após alteração dos campos', async () => {
    const { page, api } = await setup();
    await fill(page);
    const response = new Subject<SimulacaoPlanejamento>();
    api.simular.mockReturnValue(response);
    const pending = page.simular();
    page.form.controls.quantidade.setValue(20);
    response.next(simulation);
    response.complete();
    await pending;
    expect(page.simulacao()).toBeNull();
  });
  it('cria uma vez e navega ao detalhe retornado sem aprovar', async () => {
    const { page, api, creation, navigate } = await setup();
    await fill(page);
    await page.simular();
    const pending = page.salvar();
    await page.salvar();
    expect(api.criar).toHaveBeenCalledExactlyOnceWith(input);
    expect(navigate).not.toHaveBeenCalled();
    creation.next({ id: '7', versaoId: '8' });
    creation.complete();
    await pending;
    expect(navigate).toHaveBeenCalledWith(['/planejamentos', '7'], { state: { criado: true } });
    expect(api.aprovar).not.toHaveBeenCalled();
    expect(page.saving()).toBe(false);
  });
  it('revisão exige motivo, usa contrato real e recarrega detalhe', async () => {
    const { page, api } = await setup('7');
    await page.abrirRevisao();
    await fill(page);
    page.form.controls.motivo.setValue('');
    await page.simular();
    await page.salvar();
    expect(api.revisar).not.toHaveBeenCalled();
    page.form.controls.motivo.setValue(' Demanda atualizada ');
    await page.simular();
    await page.salvar();
    expect(api.revisar).toHaveBeenCalledWith('7', {
      quantidade: 12,
      modeloCestaVersaoId: '4',
      motivo: 'Demanda atualizada',
    });
    expect(api.obter).toHaveBeenCalledTimes(2);
    expect(page.simulacao()).toBeNull();
  });
  it('somente visualização permite simular mas não criar, revisar ou aprovar', async () => {
    const { page, api } = await setup(null, false);
    await fill(page);
    await page.simular();
    await page.salvar();
    await page.abrirRevisao();
    await page.aprovar();
    expect(api.simular).toHaveBeenCalledOnce();
    expect(api.criar).not.toHaveBeenCalled();
    expect(api.revisar).not.toHaveBeenCalled();
    expect(api.aprovar).not.toHaveBeenCalled();
  });
  it('aprovação não depende da permission de gerenciar modelos', async () => {
    const { page, api, modelos, approval, stock } = await setup('7', true, false);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const pending = page.aprovar();
    await page.aprovar();
    expect(api.aprovar).toHaveBeenCalledExactlyOnceWith('7');
    expect(page.detalhe()?.versoes[0]?.status).toBe('SIMULACAO');
    expect(modelos.execute).not.toHaveBeenCalled();
    const approved: PlanejamentoDetalhe = {
      ...plan,
      versoes: [
        {
          ...plan.versoes[0]!,
          status: 'APROVADA',
          itens: [
            { apresentacaoInsumoId: '5', quantidadePorCesta: 2, reservado: 24, consumido: 0 },
          ],
        },
      ],
    };
    api.obter.mockReturnValue(of(approved));
    approval.next();
    approval.complete();
    await pending;
    expect(page.detalhe()).toEqual(approved);
    expect(stock.execute).toHaveBeenCalledTimes(2);
    expect(page.feedback()).toContain('confirmada');
  });
  it('cancelar confirmação não envia aprovação', async () => {
    const { page, api } = await setup('7');
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    await page.aprovar();
    expect(api.aprovar).not.toHaveBeenCalled();
  });
  it('conflito informa concorrência, recarrega saldos e não assume reserva', async () => {
    const { page, api, approval, stock } = await setup('7');
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const pending = page.aprovar();
    approval.error(
      new HttpErrorResponse({
        status: 409,
        error: { error: { code: 'SALDO_INSUFICIENTE', message: 'SQL privado' } },
      }),
    );
    await pending;
    expect(page.mutationError()).toContain('outra operação');
    expect(page.mutationError()).not.toContain('SQL');
    expect(api.obter).toHaveBeenCalledTimes(2);
    expect(stock.execute).toHaveBeenCalledTimes(2);
    expect(page.detalhe()).toEqual(plan);
    expect(page.feedback()).toBe('');
    expect(page.saving()).toBe(false);
  });
});
