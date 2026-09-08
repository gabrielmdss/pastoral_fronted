import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AbrirDistribuicaoUseCase } from '../../../application/distribuicoes/abrir-distribuicao.use-case';
import { EncerrarDistribuicaoUseCase } from '../../../application/distribuicoes/encerrar-distribuicao.use-case';
import { ObterDistribuicaoUseCase } from '../../../application/distribuicoes/obter-distribuicao.use-case';
import { RemarcarDistribuicaoUseCase } from '../../../application/distribuicoes/remarcar-distribuicao.use-case';
import type { Distribuicao } from '../../../domain/distribuicoes/distribuicao.model';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import DistribuicaoDetailPage from './distribuicao-detail.page';
const item: Distribuicao = {
  id: '3', status: 'PLANEJADA', dataPrevista: '2026-09-12', dataReal: null,
  competencia: { id: '9', ano: 2026, mes: 9 }, grupo: { id: '2', codigo: 'A', nome: 'Grupo A' },
  previstos: 2, checkIns: 0, regularesPresentes: 0, pendentesPresentes: 0, retiradas: 0, ausentes: 0,
  naoAtendidosEstoque: 0, naoAtendidosIrregularidade: 0, cestasLiberadas: 0, cestasConsumidas: 0,
  cestasRetornadas: 0, cestasDisponiveis: 0,
};
function setup(permission = true, status: Distribuicao['status'] = 'PLANEJADA') {
  const response = new Subject<void>();
  const remarcar = vi.fn(() => response);
  const obter = vi.fn().mockReturnValueOnce(of({ ...item, status })).mockReturnValue(of({ ...item, dataPrevista: '2026-09-19' }));
  TestBed.configureTestingModule({ providers: [
    provideRouter([]),
    { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '3' }) } } },
    { provide: SessionFacade, useValue: { hasPermission: (p: string) => permission && p === 'DISTRIBUICAO_REMARCAR' } },
    { provide: ObterDistribuicaoUseCase, useValue: { execute: obter } },
    { provide: RemarcarDistribuicaoUseCase, useValue: { execute: remarcar } },
    { provide: AbrirDistribuicaoUseCase, useValue: { execute: vi.fn() } },
    { provide: EncerrarDistribuicaoUseCase, useValue: { execute: vi.fn() } },
  ] });
  const fixture = TestBed.createComponent(DistribuicaoDetailPage);
  const page = fixture.componentInstance;
  page.remarcacao.setValue({ novaData: '2026-09-19', motivo: '  Alteração local  ' });
  fixture.detectChanges();
  return { fixture, page, remarcar, obter, response };
}
describe('remarcação no detalhe existente', () => {
  afterEach(() => { vi.restoreAllMocks(); TestBed.resetTestingModule(); });
  it.each(['PLANEJADA', 'PREPARADA'] as const)('confirma, impede duplicação e recarrega: %s', status => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { page, remarcar, obter, response } = setup(true, status);
    page.remarcar(); page.remarcar();
    expect(confirm).toHaveBeenCalledOnce();
    expect(remarcar).toHaveBeenCalledExactlyOnceWith('3', { novaData: '2026-09-19', motivo: 'Alteração local' });
    expect(page.remarcando()).toBe(true);
    response.next(); response.complete();
    expect(page.remarcando()).toBe(false);
    expect(obter).toHaveBeenCalledTimes(2);
    expect(page.distribuicao()?.dataPrevista).toBe('2026-09-19');
    expect(page.remarcacaoFeedback()).toContain('sucesso');
  });
  it('não envia sem confirmação', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { page, remarcar } = setup();
    page.remarcar();
    expect(remarcar).not.toHaveBeenCalled();
  });
  it.each([
    { permission: false, status: 'PLANEJADA' as const },
    { permission: true, status: 'ABERTA' as const },
    { permission: true, status: 'ENCERRADA' as const },
  ])('bloqueia ação sem permission ou estado permitido: %j', ({ permission, status }) => {
    const { fixture, page, remarcar } = setup(permission, status);
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    page.remarcar();
    expect(remarcar).not.toHaveBeenCalled();
  });
  it.each(['', 'ab', '   ', 'a'.repeat(1001)])('valida motivo exigido: %s', motivo => {
    const { page, remarcar } = setup();
    page.remarcacao.controls.motivo.setValue(motivo);
    page.remarcar();
    expect(remarcar).not.toHaveBeenCalled();
  });
  it('trata conflito do backend e libera nova tentativa sem perder dados', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { page, response, obter } = setup();
    page.remarcar();
    response.error(new HttpErrorResponse({ status: 409, error: { error: { code: 'DISTRIBUICAO_NAO_REMARCAVEL' } } }));
    expect(page.remarcacaoError()).toContain('status atual');
    expect(page.remarcando()).toBe(false);
    expect(page.remarcacao.controls.novaData.value).toBe('2026-09-19');
    expect(obter).toHaveBeenCalledOnce();
  });
});
