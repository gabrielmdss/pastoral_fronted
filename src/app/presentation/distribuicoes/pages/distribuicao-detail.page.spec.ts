import { TestBed, type ComponentFixture } from '@angular/core/testing';
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
import { ObterHistoricoDistribuicaoUseCase } from '../../../application/atendimento/use-cases/obter-historico.use-cases';
import { responderConfirmacao } from '../../../shared/ui/confirm-dialog.testing';

const historico = vi.fn(() => of({ distribuicao: { id: '3', data: '2026-09-04', grupo: 'A' }, eventos: [
  { tipo: 'RETIRADA', ocorridoEm: '2026-09-04T13:00:00Z', detalhes: { retiradaId: '5', beneficiarioId: '8' } },
  { tipo: 'ABERTURA', ocorridoEm: '2026-09-04T12:00:00Z', detalhes: { status: 'ABERTA' } },
] }));

const aberta: Distribuicao = {
  id: '3', status: 'ABERTA', dataPrevista: '2026-09-04', dataReal: null,
  competencia: { id: '9', ano: 2026, mes: 9 },
  grupo: { id: '2', codigo: 'A', nome: 'Grupo A' },
  previstos: 2, checkIns: 2, regularesPresentes: 2, pendentesPresentes: 0,
  retiradas: 2, ausentes: 0, naoAtendidosEstoque: 0,
  naoAtendidosIrregularidade: 0, cestasLiberadas: 2, cestasConsumidas: 2,
  cestasRetornadas: 0, cestasDisponiveis: 0,
};

function setup(permission: boolean, encerrar: ReturnType<typeof vi.fn>, obter: ReturnType<typeof vi.fn>, triagem = false, extras: string[] = []) {
  TestBed.configureTestingModule({
    imports: [DistribuicaoDetailPage],
    providers: [
      provideRouter([]),
      { provide: RemarcarDistribuicaoUseCase, useValue: { execute: vi.fn() } },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '3' }) } } },
      { provide: ObterDistribuicaoUseCase, useValue: { execute: obter } },
      { provide: AbrirDistribuicaoUseCase, useValue: { execute: vi.fn() } },
      { provide: EncerrarDistribuicaoUseCase, useValue: { execute: encerrar } },
      { provide: ObterHistoricoDistribuicaoUseCase, useValue: { execute: historico } },
      {
        provide: SessionFacade,
        useValue: { hasPermission: (code: string) => (permission && code === 'DISTRIBUICAO_ENCERRAR') || (triagem && code === 'DISTRIBUICAO_TRIAGEM') || extras.includes(code) },
      },
    ],
  });
  fixtureAtual = TestBed.createComponent(DistribuicaoDetailPage);
  return fixtureAtual.componentInstance;
}
let fixtureAtual: ComponentFixture<DistribuicaoDetailPage>;

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

  it('exibe histórico em linha do tempo com link para o beneficiário', () => {
    setup(false, vi.fn(), vi.fn().mockReturnValue(of(aberta)));
    const fixture = TestBed.createComponent(DistribuicaoDetailPage);
    fixture.detectChanges();
    expect(historico).toHaveBeenCalledWith('3');
    const itens = fixture.nativeElement.querySelectorAll('.ui-timeline__item');
    expect(itens.length).toBe(2);
    expect(itens[0].textContent).toContain('Retirada');
    expect(fixture.nativeElement.querySelector('a[href="/beneficiarios/8"]')).toBeTruthy();
  });

  it.each([
    [['ESTOQUE_VISUALIZAR'], false],
    [['ESTOQUE_VISUALIZAR', 'BENEFICIARIO_VISUALIZAR'], true],
  ])('link de liberações segue os guards da rota: %s', (perms, visivel) => {
    setup(false, vi.fn(), vi.fn().mockReturnValue(of(aberta)), false, perms);
    const fixture = TestBed.createComponent(DistribuicaoDetailPage);
    fixture.detectChanges();
    expect(Boolean(fixture.nativeElement.querySelector('a[href="/distribuicoes/3/liberacoes"]'))).toBe(visivel);
  });

  it('confirma, impede envio duplo e recarrega status ENCERRADA', async () => {
    const resposta = new Subject<void>();
    const encerrar = vi.fn().mockReturnValue(resposta);
    const obter = vi.fn()
      .mockReturnValueOnce(of(aberta))
      .mockReturnValueOnce(of({ ...aberta, status: 'ENCERRADA' as const }));
    const page = setup(true, encerrar, obter);

    const pending = page.encerrar();
    const texto = await responderConfirmacao(fixtureAtual);
    await page.encerrar();
    await pending;
    expect(texto).toContain('encerrar a distribuição');
    expect(encerrar).toHaveBeenCalledOnce();
    expect(page.encerrando()).toBe(true);

    resposta.next();
    resposta.complete();
    expect(page.distribuicao()?.status).toBe('ENCERRADA');
    expect(page.encerrando()).toBe(false);
  });

  it('não envia sem a permission real', async () => {
    const encerrar = vi.fn().mockReturnValue(of(undefined));
    const page = setup(false, encerrar, vi.fn().mockReturnValue(of(aberta)));

    await page.encerrar();
    fixtureAtual.detectChanges();

    expect(fixtureAtual.nativeElement.querySelector('app-confirm-dialog')).toBeNull();
    expect(encerrar).not.toHaveBeenCalled();
  });
});
