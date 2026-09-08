import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import {
  provideRouter,
  Router,
  type ActivatedRouteSnapshot,
  type RouterStateSnapshot,
} from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as U from '../../../application/relatorios/relatorios.use-cases';
import { ListarGruposUseCase } from '../../../application/beneficiarios/catalogos.use-cases';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import { relatoriosGuard } from '../../../infrastructure/auth/relatorios.guard';
import type {
  LinhaDistribuicao,
  PaginaRelatorio,
} from '../../../domain/relatorios/relatorios.model';
import RelatoriosPage from './relatorios.page';
const empty = { data: [], meta: { page: 1, limit: 50, total: 0, totalPages: 0 } };
function setup(permissions = ['BENEFICIARIO_VISUALIZAR', 'ESTOQUE_VISUALIZAR']) {
  const distribuicoes = vi.fn().mockReturnValue(of(empty));
  const beneficiarios = vi.fn().mockReturnValue(of(empty));
  const estoque = vi.fn().mockReturnValue(of(empty));
  const grupos = vi
    .fn()
    .mockReturnValue(of([{ id: '3', nome: 'Grupo Azul', codigo: 'A', regraCalendario: '' }]));
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: SessionFacade,
        useValue: { hasPermission: (p: string) => permissions.includes(p) },
      },
      { provide: U.RelatorioDistribuicoesUseCase, useValue: { execute: distribuicoes } },
      { provide: U.RelatorioBeneficiariosUseCase, useValue: { execute: beneficiarios } },
      { provide: U.RelatorioEstoqueUseCase, useValue: { execute: estoque } },
      { provide: ListarGruposUseCase, useValue: { execute: grupos } },
    ],
  });
  const fixture = TestBed.createComponent(RelatoriosPage);
  fixture.detectChanges();
  return {
    fixture,
    page: fixture.componentInstance,
    distribuicoes,
    beneficiarios,
    estoque,
    grupos,
  };
}
describe('Relatórios: consulta e permissões', () => {
  afterEach(() => TestBed.resetTestingModule());
  it.each([
    { permissions: [], types: [] },
    { permissions: ['BENEFICIARIO_VISUALIZAR'], types: ['distribuicoes', 'beneficiarios'] },
    { permissions: ['ESTOQUE_VISUALIZAR'], types: ['estoque'] },
  ])('limita relatórios e guard por $permissions', ({ permissions, types }) => {
    const { page, grupos, distribuicoes } = setup(permissions);
    expect(page.tipos.map((t) => t.id)).toEqual(types);
    const result = TestBed.runInInjectionContext(() =>
      relatoriosGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
    if (types.length) expect(result).toBe(true);
    else {
      expect(
        TestBed.inject(Router).serializeUrl(result as ReturnType<Router['createUrlTree']>),
      ).toBe('/acesso-negado');
      page.consultar();
      expect(distribuicoes).not.toHaveBeenCalled();
    }
    expect(grupos).toHaveBeenCalledTimes(permissions.includes('BENEFICIARIO_VISUALIZAR') ? 1 : 0);
  });
  it('aplica filtros reais e repete consulta inalterada', () => {
    const { page, distribuicoes, fixture } = setup();
    page.form.patchValue({
      competencia: '2026-09',
      grupoId: '3',
      statusDistribuicao: 'ENCERRADA',
      dataInicio: '2026-09-01',
      dataFim: '2026-09-30',
    });
    page.consultar();
    page.consultar();
    expect(distribuicoes).toHaveBeenCalledTimes(2);
    expect(distribuicoes).toHaveBeenLastCalledWith({
      page: 1,
      limit: 50,
      competencia: '2026-09',
      grupoId: '3',
      status: 'ENCERRADA',
      dataInicio: '2026-09-01',
      dataFim: '2026-09-30',
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Grupo Azul');
    expect(fixture.nativeElement.textContent).toContain('Nenhum registro');
  });
  it('troca relatório limpando filtros e resultado anteriores', () => {
    const { page, beneficiarios } = setup();
    page.form.patchValue({ competencia: '2026-09', grupoId: '3', statusDistribuicao: 'ABERTA' });
    page.consultar();
    page.tipo.setValue('beneficiarios');
    expect(page.resultado()).toBeNull();
    expect(page.form.controls.competencia.value).toBe('');
    page.form.patchValue({
      statusBeneficiario: 'ATIVO',
      dataAdmissaoInicio: '2026-01-01',
      dataAdmissaoFim: '2026-09-07',
    });
    page.consultar();
    expect(beneficiarios).toHaveBeenCalledWith({
      page: 1,
      limit: 50,
      status: 'ATIVO',
      dataAdmissaoInicio: '2026-01-01',
      dataAdmissaoFim: '2026-09-07',
    });
  });
  it('estoque usa pesquisa textual e movimento sem filtros assistenciais', () => {
    const { page, estoque } = setup(['ESTOQUE_VISUALIZAR']);
    page.form.patchValue({ insumo: ' Arroz ', tipoMovimento: 'PERDA', dataInicio: '2026-09-01' });
    page.consultar();
    expect(estoque).toHaveBeenCalledWith({
      page: 1,
      limit: 50,
      insumo: 'Arroz',
      tipoMovimento: 'PERDA',
      dataInicio: '2026-09-01',
    });
    page.tipo.setValue('beneficiarios');
    page.consultar();
    expect(estoque).toHaveBeenCalledTimes(1);
  });
  it('paginação usa meta mesmo quando total difere da quantidade visível', () => {
    const { page, distribuicoes } = setup();
    distribuicoes.mockReturnValue(
      of({ ...empty, meta: { page: 2, limit: 50, total: 251, totalPages: 6 } }),
    );
    page.consultar(2);
    page.proxima();
    expect(distribuicoes).toHaveBeenLastCalledWith({ page: 3, limit: 50 });
    distribuicoes.mockReturnValue(
      of({ ...empty, meta: { page: 3, limit: 50, total: 0, totalPages: 0 } }),
    );
    page.consultar(3);
    page.anterior();
    expect(distribuicoes).toHaveBeenLastCalledWith({ page: 2, limit: 50 });
  });
  it('filtrar cancela consulta pendente e não reaproveita resposta antiga', () => {
    const { page, distribuicoes, fixture } = setup();
    const pending = new Subject<PaginaRelatorio<LinhaDistribuicao>>();
    distribuicoes.mockReturnValue(pending);
    page.consultar();
    fixture.detectChanges();
    expect(page.loading()).toBe(true);
    expect(fixture.nativeElement.querySelector('button[type=submit]').disabled).toBe(true);
    page.form.patchValue({ grupoId: '3' });
    expect(page.loading()).toBe(false);
    pending.next(empty);
    expect(page.resultado()).toBeNull();
    distribuicoes.mockReturnValue(of(empty));
    page.consultar();
    expect(page.resultado()?.tipo).toBe('distribuicoes');
  });
  it('trocar relatório descarta resposta anterior pendente', () => {
    const { page, distribuicoes } = setup();
    const pending = new Subject<PaginaRelatorio<LinhaDistribuicao>>();
    distribuicoes.mockReturnValue(pending);
    page.consultar();
    page.tipo.setValue('estoque');
    pending.next(empty);
    expect(page.resultado()).toBeNull();
    page.consultar();
    expect(page.resultado()?.tipo).toBe('estoque');
  });
  it.each([400, 403, 500, 0])(
    'trata erro %s sem detalhes internos e retry preserva página',
    (status) => {
      const { page, distribuicoes, fixture } = setup();
      distribuicoes.mockReturnValue(
        throwError(
          () => new HttpErrorResponse({ status, error: { message: 'SQL stack privado' } }),
        ),
      );
      page.consultar(3);
      fixture.detectChanges();
      expect(page.loading()).toBe(false);
      expect(page.error()).toBeTruthy();
      expect(page.error()).not.toContain('SQL');
      expect(fixture.nativeElement.querySelector('[role=alert]')).toBeTruthy();
      distribuicoes.mockReturnValue(of(empty));
      page.retry();
      expect(distribuicoes).toHaveBeenLastCalledWith({ page: 3, limit: 50 });
      expect(page.error()).toBe('');
    },
  );
  it.each([0, 101, 1.5])('bloqueia limite inválido %s', (limit) => {
    const { page, distribuicoes } = setup();
    page.form.patchValue({ limit });
    page.consultar();
    expect(distribuicoes).not.toHaveBeenCalled();
  });
  it('falha de catálogo permite consulta sem grupo e nova tentativa independente', () => {
    const { page, grupos, distribuicoes } = setup();
    grupos.mockReturnValue(throwError(() => new Error('private')));
    page.carregarGrupos();
    expect(page.gruposError()).toBeTruthy();
    page.consultar();
    expect(distribuicoes).toHaveBeenCalled();
    grupos.mockReturnValue(of([]));
    page.carregarGrupos();
    expect(page.gruposError()).toBe('');
  });
});
