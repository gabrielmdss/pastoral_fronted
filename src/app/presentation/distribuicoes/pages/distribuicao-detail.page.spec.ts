import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AbrirDistribuicaoUseCase } from '../../../application/distribuicoes/abrir-distribuicao.use-case';
import { EncerrarDistribuicaoUseCase } from '../../../application/distribuicoes/encerrar-distribuicao.use-case';
import { ObterDistribuicaoUseCase } from '../../../application/distribuicoes/obter-distribuicao.use-case';
import type { Distribuicao } from '../../../domain/distribuicoes/distribuicao.model';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import DistribuicaoDetailPage from './distribuicao-detail.page';
import { RemarcarDistribuicaoUseCase } from '../../../application/distribuicoes/remarcar-distribuicao.use-case';

const aberta: Distribuicao = {
  id: '3', status: 'ABERTA', dataPrevista: '2026-09-04', dataReal: null,
  competencia: { id: '9', ano: 2026, mes: 9 },
  grupo: { id: '2', codigo: 'A', nome: 'Grupo A' },
  previstos: 2, checkIns: 2, regularesPresentes: 2, pendentesPresentes: 0,
  retiradas: 2, ausentes: 0, naoAtendidosEstoque: 0,
  naoAtendidosIrregularidade: 0, cestasLiberadas: 2, cestasConsumidas: 2,
  cestasRetornadas: 0, cestasDisponiveis: 0,
};

function setup(permission: boolean, encerrar: ReturnType<typeof vi.fn>, obter: ReturnType<typeof vi.fn>, triagem = false) {
  TestBed.configureTestingModule({
    imports: [DistribuicaoDetailPage],
    providers: [
      provideRouter([]),
      { provide: RemarcarDistribuicaoUseCase, useValue: { execute: vi.fn() } },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '3' }) } } },
      { provide: ObterDistribuicaoUseCase, useValue: { execute: obter } },
      { provide: AbrirDistribuicaoUseCase, useValue: { execute: vi.fn() } },
      { provide: EncerrarDistribuicaoUseCase, useValue: { execute: encerrar } },
      {
        provide: SessionFacade,
        useValue: { hasPermission: (code: string) => (permission && code === 'DISTRIBUICAO_ENCERRAR') || (triagem && code === 'DISTRIBUICAO_TRIAGEM') },
      },
    ],
  });
  return TestBed.createComponent(DistribuicaoDetailPage).componentInstance;
}

describe('DistribuicaoDetailPage - encerramento', () => {
  afterEach(() => TestBed.resetTestingModule());

  it.each([true, false])('acesso histórico encerrado respeita triagem: %s', triagem => {
    setup(false, vi.fn(), vi.fn().mockReturnValue(of({ ...aberta, status: 'ENCERRADA' })), triagem);
    const fixture = TestBed.createComponent(DistribuicaoDetailPage);
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('a[href="/distribuicoes/3/atendimento"]');
    expect(Boolean(link)).toBe(triagem);
    expect(fixture.nativeElement.textContent).not.toContain('Iniciar atendimento');
    expect(fixture.nativeElement.querySelectorAll('.distribuicao-detail-actions button').length).toBe(0);
  });

  it('confirma, impede envio duplo e recarrega status ENCERRADA', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const resposta = new Subject<void>();
    const encerrar = vi.fn().mockReturnValue(resposta);
    const obter = vi.fn()
      .mockReturnValueOnce(of(aberta))
      .mockReturnValueOnce(of({ ...aberta, status: 'ENCERRADA' as const }));
    const page = setup(true, encerrar, obter);

    page.encerrar();
    page.encerrar();
    expect(encerrar).toHaveBeenCalledOnce();
    expect(page.encerrando()).toBe(true);

    resposta.next();
    resposta.complete();
    expect(page.distribuicao()?.status).toBe('ENCERRADA');
    expect(page.encerrando()).toBe(false);
  });

  it('não envia sem a permission real', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const encerrar = vi.fn().mockReturnValue(of(undefined));
    const page = setup(false, encerrar, vi.fn().mockReturnValue(of(aberta)));

    page.encerrar();

    expect(encerrar).not.toHaveBeenCalled();
  });
});
