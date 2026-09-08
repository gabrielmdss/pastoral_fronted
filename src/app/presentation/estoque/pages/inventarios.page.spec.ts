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
import * as U from '../../../application/estoque/inventarios.use-cases';
import { INVENTARIOS_API } from '../../../application/estoque/inventarios-api.port';
import { ListarInsumosUseCase } from '../../../application/estoque/estoque.use-cases';
import type { Inventario } from '../../../domain/estoque/inventario.model';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import { appRoutes } from '../../../main/app.routes';
import Layout from '../../layout/authenticated-layout.component';
import Page from './inventarios.page';
const inv: Inventario = {
  id: '1',
  status: 'ABERTO',
  usuarioResponsavelId: '2',
  iniciadoEm: '2026-09-07T12:00:00Z',
  concluidoEm: null,
  itens: [
    {
      apresentacaoId: '3',
      insumo: 'Arroz',
      apresentacao: '1 kg',
      saldoSistema: 10,
      saldoFisico: 10,
      diferenca: 0,
    },
    {
      apresentacaoId: '4',
      insumo: 'Feijão',
      apresentacao: '1 kg',
      saldoSistema: 7,
      saldoFisico: 5,
      diferenca: -2,
    },
  ],
};
async function setup(id: string | null = '1', allowed = true, view = true) {
  const response = new Subject<void>(),
    created = new Subject<{ id: string }>();
  const api = {
    criar: vi.fn(() => created.asObservable()),
    obter: vi.fn(() => of<Inventario | null>(inv)),
    contar: vi.fn(() => response.asObservable()),
    concluir: vi.fn(() => response.asObservable()),
  };
  const stock = { execute: vi.fn(() => of([])) };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      ...Object.values(U),
      { provide: INVENTARIOS_API, useValue: api },
      { provide: ListarInsumosUseCase, useValue: stock },
      { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap(id ? { id } : {})) } },
      {
        provide: SessionFacade,
        useValue: {
          hasPermission: (p: string) =>
            (p === 'ESTOQUE_INVENTARIO' && allowed) || (p === 'ESTOQUE_VISUALIZAR' && view),
          currentUser: () => ({ login: 'operador' }),
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(Page),
    page = fixture.componentInstance;
  await vi.waitFor(() => expect(page.loading()).toBe(false));
  const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  return { fixture, page, api, stock, response, created, navigate };
}
describe('Inventários: fluxo frontend', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });
  it('área informa ausência de listagem e consulta somente por código real', async () => {
    const { page, api, fixture, navigate } = await setup(null);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('não disponibiliza listagem');
    expect(api.obter).not.toHaveBeenCalled();
    page.codigo.setValue('123');
    page.consultar();
    expect(navigate).toHaveBeenCalledWith(['/inventarios', '123']);
  });
  it('detalhe exibe dados reais e não afirma que todos foram contados', async () => {
    const { page, fixture } = await setup();
    fixture.detectChanges();
    expect(page.inventario()).toEqual(inv);
    expect(fixture.nativeElement.textContent).toContain('Arroz');
    expect(fixture.nativeElement.textContent).toContain('Não há indicação');
    expect(page.divergentes()).toBe(1);
  });
  it('erro, retry, inexistente e vazio possuem feedback', async () => {
    const { page, api, fixture } = await setup();
    api.obter.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 500 })));
    await page.carregar();
    expect(page.error()).toBeTruthy();
    api.obter.mockReturnValueOnce(of(null));
    await page.carregar();
    expect(page.error()).toContain('não encontrado');
    api.obter.mockReturnValue(of({ ...inv, itens: [] }));
    await page.carregar();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nenhum item');
    expect(api.obter).toHaveBeenCalledTimes(4);
  });
  it('abre uma vez sem saldo capturado no frontend e navega ao detalhe', async () => {
    const { page, api, created, navigate } = await setup(null);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const pending = page.criar();
    await page.criar();
    expect(api.criar).toHaveBeenCalledOnce();
    created.next({ id: '8' });
    created.complete();
    await pending;
    expect(navigate).toHaveBeenCalledWith(['/inventarios', '8'], { state: { criado: true } });
    expect(page.saving()).toBe(false);
  });
  it('cancelar abertura não cria', async () => {
    const { page, api } = await setup(null);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    await page.criar();
    expect(api.criar).not.toHaveBeenCalled();
  });
  it('contagem zero válida, bloqueio duplo e refresh preservando outro rascunho', async () => {
    const { page, api, response, stock } = await setup();
    const a = page.controles()['3']!,
      b = page.controles()['4']!;
    a.setValue(0);
    a.markAsDirty();
    b.setValue(2);
    b.markAsDirty();
    const pending = page.contar('3');
    await page.contar('3');
    expect(api.contar).toHaveBeenCalledExactlyOnceWith('1', '3', 0);
    expect(page.inventario()?.itens[0]?.saldoFisico).toBe(10);
    api.obter.mockReturnValue(
      of({ ...inv, itens: [{ ...inv.itens[0]!, saldoFisico: 0, diferenca: -10 }, inv.itens[1]!] }),
    );
    response.next();
    response.complete();
    await pending;
    expect(page.controles()['3']?.value).toBe(0);
    expect(page.controles()['3']?.pristine).toBe(true);
    expect(page.controles()['4']?.value).toBe(2);
    expect(page.controles()['4']?.dirty).toBe(true);
    expect(stock.execute).toHaveBeenCalledTimes(2);
    expect(page.inventario()?.itens[0]?.diferenca).toBe(-10);
  });
  it.each([-1, 1.5, null])('não envia contagem inválida %s', async (value) => {
    const { page, api } = await setup();
    page.controles()['3']!.setValue(value);
    await page.contar('3');
    expect(api.contar).not.toHaveBeenCalled();
  });
  it('conclusão confirma resumo e não exige marcação de todos contados', async () => {
    const { page, api, response, stock, fixture } = await setup();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const pending = page.concluir();
    await page.concluir();
    expect(api.concluir).toHaveBeenCalledExactlyOnceWith('1');
    expect(confirm.mock.calls[0]?.[0]).toContain('2 itens retornados; 1 com divergência');
    expect(page.inventario()?.status).toBe('ABERTO');
    api.obter.mockReturnValue(
      of({ ...inv, status: 'CONCLUIDO', concluidoEm: '2026-09-07T13:00:00Z' }),
    );
    response.next();
    response.complete();
    await pending;
    expect(page.inventario()?.status).toBe('CONCLUIDO');
    expect(stock.execute).toHaveBeenCalledTimes(2);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Salvar contagem');
  });
  it('confirmação alerta sobre rascunhos locais e cancelamento não conclui', async () => {
    const { page, api } = await setup();
    page.controles()['3']!.markAsDirty();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await page.concluir();
    expect(confirm.mock.calls[0]?.[0]).toContain('não salva');
    expect(api.concluir).not.toHaveBeenCalled();
  });
  it('stale reconsulta e preserva valores sem sincronizar ou criar automaticamente', async () => {
    const { page, api, response, stock } = await setup();
    page.controles()['3']!.setValue(8);
    page.controles()['3']!.markAsDirty();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const pending = page.concluir();
    response.error(
      new HttpErrorResponse({
        status: 409,
        error: { error: { code: 'INVENTARIO_DESATUALIZADO', message: 'SQL privado' } },
      }),
    );
    await pending;
    expect(page.mutationError()).toContain('alterado após a abertura');
    expect(page.mutationError()).toContain('Abra um novo inventário');
    expect(page.mutationError()).not.toContain('SQL');
    expect(page.controles()['3']?.value).toBe(8);
    expect(page.inventario()?.status).toBe('ABERTO');
    expect(api.obter).toHaveBeenCalledTimes(2);
    expect(stock.execute).toHaveBeenCalledTimes(2);
    expect(api.criar).not.toHaveBeenCalled();
    expect(page.feedback()).toBe('');
  });
  it('409 na contagem recarrega estado final sem presumir sucesso', async () => {
    const { page, api, response } = await setup();
    const pending = page.contar('3');
    api.obter.mockReturnValue(of({ ...inv, status: 'CONCLUIDO' }));
    response.error(
      new HttpErrorResponse({
        status: 409,
        error: { error: { code: 'INVENTARIO_ITEM_NAO_ENCONTRADO' } },
      }),
    );
    await pending;
    expect(page.mutationError()).toContain('outra operação');
    expect(page.inventario()?.status).toBe('CONCLUIDO');
    expect(page.feedback()).toBe('');
  });
  it.each(['CONCLUIDO', 'CANCELADO'] as const)(
    'estado %s impede contagem e conclusão',
    async (status) => {
      const { page, api } = await setup();
      api.obter.mockReturnValue(of({ ...inv, status }));
      await page.carregar();
      await page.contar('3');
      await page.concluir();
      expect(api.contar).not.toHaveBeenCalled();
      expect(api.concluir).not.toHaveBeenCalled();
    },
  );
  it('permission de inventário é suficiente; não consulta estoque sem acesso específico', async () => {
    const { page, stock } = await setup('1', true, false);
    expect(page.inventario()).toEqual(inv);
    expect(stock.execute).not.toHaveBeenCalled();
  });
  it('erro do saldo atual não impede consultar o inventário', async () => {
    const { page, stock } = await setup();
    stock.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 403 })));
    await page.carregar();
    expect(page.error()).toBe('');
    expect(page.estoqueError()).toBeTruthy();
    expect(page.inventario()).toEqual(inv);
  });
  it.each([false, true])(
    'menu, rotas e ações respeitam ESTOQUE_INVENTARIO: %s',
    async (allowed) => {
      const { page, api } = await setup('1', allowed);
      const fixture = TestBed.createComponent(Layout);
      fixture.detectChanges();
      expect(!!fixture.nativeElement.querySelector('a[href="/inventarios"]')).toBe(allowed);
      for (const path of ['inventarios', 'inventarios/:id']) {
        const route = appRoutes.find((r) => r.children)?.children?.find((r) => r.path === path);
        if (!route) throw new Error(`Rota ausente: ${path}`);
        const result = TestBed.runInInjectionContext(() =>
          (route.canActivate![0] as CanActivateFn)({} as never, {} as never),
        );
        if (allowed) expect(result).toBe(true);
        else
          expect(
            TestBed.inject(Router).serializeUrl(result as ReturnType<Router['createUrlTree']>),
          ).toBe('/acesso-negado');
      }
      if (!allowed) {
        await page.criar();
        await page.contar('3');
        await page.concluir();
        expect(api.criar).not.toHaveBeenCalled();
        expect(api.contar).not.toHaveBeenCalled();
        expect(api.concluir).not.toHaveBeenCalled();
        expect(api.obter).not.toHaveBeenCalled();
      }
    },
  );
});
