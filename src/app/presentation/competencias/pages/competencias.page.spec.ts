import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, Subject, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GerarCompetenciaUseCase, ListarCompetenciasUseCase, ObterCompetenciaUseCase } from '../../../application/competencias/competencias.use-cases';
import type { Competencia } from '../../../domain/competencias/competencia.model';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import { appRoutes } from '../../../main/app.routes';
import CompetenciasPage from './competencias.page';

const item: Competencia = { id: '7', ano: 2026, mes: 9, status: 'ABERTA', distribuicoes: 2, direitos: 40 };
function setup(permission = true, id?: string) {
  const listar = vi.fn(() => of([item]));
  const obter = vi.fn(() => of(item));
  const response = new Subject<Competencia>();
  const gerar = vi.fn(() => response);
  TestBed.configureTestingModule({ providers: [
    provideRouter([]),
    { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } } },
    { provide: SessionFacade, useValue: { hasPermission: (p: string) => permission && p === 'DISTRIBUICAO_ABRIR' } },
    { provide: ListarCompetenciasUseCase, useValue: { execute: listar } },
    { provide: ObterCompetenciaUseCase, useValue: { execute: obter } },
    { provide: GerarCompetenciaUseCase, useValue: { execute: gerar } },
  ] });
  const fixture = TestBed.createComponent(CompetenciasPage);
  fixture.detectChanges();
  return { fixture, page: fixture.componentInstance, listar, obter, gerar, response };
}
describe('Competências', () => {
  afterEach(() => TestBed.resetTestingModule());
  it('lista e oferece link de consulta', () => {
    const { fixture, listar } = setup();
    expect(listar).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.querySelector('a[href="/competencias/7"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('40');
  });
  it('consulta detalhe usando ID e exibe contagens reais', () => {
    const { fixture, obter, listar, page } = setup(true, '7');
    expect(obter).toHaveBeenCalledWith('7');
    expect(listar).not.toHaveBeenCalled();
    expect(page.detalhe()).toEqual(item);
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });
  it('gera sem duplo envio e reconsulta após sucesso', () => {
    const { page, gerar, listar, response } = setup();
    page.form.setValue({ ano: 2026, mes: 9 });
    page.gerarCompetencia();
    page.gerarCompetencia();
    expect(gerar).toHaveBeenCalledExactlyOnceWith({ ano: 2026, mes: 9 });
    expect(page.saving()).toBe(true);
    response.next(item); response.complete();
    expect(listar).toHaveBeenCalledTimes(2);
    expect(page.saving()).toBe(false);
    expect(page.feedback()).toContain('gerada com sucesso');
  });
  it('bloqueia geração sem permission e valores inválidos', () => {
    const { page, gerar, fixture } = setup(false);
    page.form.setValue({ ano: 2026, mes: 9 }); page.gerarCompetencia();
    expect(gerar).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });
  it.each([{ ano: 1999, mes: 9 }, { ano: 2201, mes: 9 }, { ano: 2026, mes: 13 }, { ano: 2026.5, mes: 1 }])('valida limites do controller: %j', input => {
    const { page, gerar } = setup();
    page.form.setValue(input); page.gerarCompetencia();
    expect(gerar).not.toHaveBeenCalled();
  });
  it('erro de geração libera envio e preserva formulário', () => {
    const { page, response } = setup();
    page.form.setValue({ ano: 2026, mes: 9 }); page.gerarCompetencia();
    response.error(new HttpErrorResponse({ status: 409, error: { error: { code: 'CONCORRENCIA_REPETIR' } } }));
    expect(page.saving()).toBe(false);
    expect(page.mutationError()).toContain('Tente novamente');
    expect(page.form.value).toEqual({ ano: 2026, mes: 9 });
  });
  it('consulta permite retry após erro conhecido', () => {
    const { page, obter } = setup(true, '7');
    obter.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 404, error: { error: { code: 'COMPETENCIA_NAO_ENCONTRADA' } } })));
    page.carregar();
    expect(page.error()).toBe('Competência não encontrada.');
    page.carregar();
    expect(page.error()).toBe('');
    expect(page.detalhe()).toEqual(item);
  });
});
describe('rotas reais de competências', () => {
  it.each([true, false])('listagem e detalhe respeitam permission: %s', async allowed => {
    const listar = vi.fn(() => of([]));
    const obter = vi.fn(() => of(item));
    TestBed.configureTestingModule({ providers: [
      provideRouter(appRoutes),
      { provide: SessionFacade, useValue: { isAuthenticated: () => true, currentUser: () => ({ login: 'u' }), hasPermission: (p: string) => allowed && p === 'BENEFICIARIO_VISUALIZAR' } },
      { provide: ListarCompetenciasUseCase, useValue: { execute: listar } },
      { provide: ObterCompetenciaUseCase, useValue: { execute: obter } },
      { provide: GerarCompetenciaUseCase, useValue: { execute: vi.fn() } },
    ] });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/competencias');
    expect(TestBed.inject(Router).url).toBe(allowed ? '/competencias' : '/acesso-negado');
    await harness.navigateByUrl('/competencias/7');
    expect(TestBed.inject(Router).url).toBe(allowed ? '/competencias/7' : '/acesso-negado');
    expect(listar).toHaveBeenCalledTimes(allowed ? 1 : 0);
    expect(obter).toHaveBeenCalledTimes(allowed ? 1 : 0);
  });
});
