import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CestasAdicionaisComponent } from './cestas-adicionais.component';
import * as U from '../../../application/atendimento/use-cases/cestas-adicionais.use-cases';
import { CESTAS_ADICIONAIS_API } from '../../../application/atendimento/ports/cestas-adicionais-api.port';
import { ObterDistribuicaoUseCase } from '../../../application/distribuicoes/obter-distribuicao.use-case';
import { AbrirDistribuicaoUseCase } from '../../../application/distribuicoes/abrir-distribuicao.use-case';
import { EncerrarDistribuicaoUseCase } from '../../../application/distribuicoes/encerrar-distribuicao.use-case';
import { RemarcarDistribuicaoUseCase } from '../../../application/distribuicoes/remarcar-distribuicao.use-case';
import { BuscarBeneficiariosUseCase } from '../../../application/beneficiarios/beneficiarios.use-cases';
import { ListarModelosUseCase } from '../../../application/cestas/modelos.use-cases';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import type { CestaAdicional } from '../../../domain/atendimento/cesta-adicional.model';
import type { Distribuicao } from '../../../domain/distribuicoes/distribuicao.model';
import DetailPage from '../../distribuicoes/pages/distribuicao-detail.page';
const d: Distribuicao = {
  id: '3',
  status: 'ABERTA',
  dataPrevista: '2026-09-12',
  dataReal: null,
  competencia: { id: '1', ano: 2026, mes: 9 },
  grupo: { id: '2', codigo: 'A', nome: 'Grupo A' },
  previstos: 2,
  checkIns: 0,
  regularesPresentes: 0,
  pendentesPresentes: 0,
  retiradas: 0,
  ausentes: 0,
  naoAtendidosEstoque: 0,
  naoAtendidosIrregularidade: 0,
  cestasLiberadas: 5,
  cestasConsumidas: 0,
  cestasRetornadas: 0,
  cestasDisponiveis: 5,
};
const row: CestaAdicional = {
  id: '7',
  beneficiario: { id: '1', nomeCompleto: 'Ana Silva' },
  distribuicaoId: '3',
  modeloCesta: { id: '2', nome: 'Especial' },
  quantidade: 2,
  justificativa: 'Necessidade avaliada',
  status: 'AUTORIZADA',
  autorizador: { id: '4', login: 'coordenador' },
  autorizadoEm: '2026-09-07T12:00:00Z',
  entrega: null,
};
const all = [
  'BENEFICIARIO_VISUALIZAR',
  'CESTA_MODELO_GERENCIAR',
  'CESTA_ADICIONAL_AUTORIZAR',
  'RETIRADA_REGISTRAR',
];
async function setup(permissions = all) {
  const response = new Subject<CestaAdicional>();
  const api = {
    listar: vi.fn(() => of([row])),
    autorizar: vi.fn(() => response.asObservable()),
    entregar: vi.fn(() => response.asObservable()),
  };
  const obter = { execute: vi.fn(() => of(d)) };
  const beneficiarios = {
    execute: vi.fn(() =>
      of([
        {
          id: '1',
          pessoaId: '1p',
          nomeCompleto: 'Ana Silva',
          status: 'ATIVO',
          documentos: [{ tipo: 'CPF', numeroMascarado: '***123' }],
          grupo: null,
          fotoPrincipal: null,
        },
      ]),
    ),
  };
  const modelos = {
    execute: vi.fn(() =>
      of([{ id: '2', nome: 'Especial', tipo: 'ESPECIAL', ativo: true, criadoEm: '2026-09-01' }]),
    ),
  };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      ...Object.values(U),
      { provide: CESTAS_ADICIONAIS_API, useValue: api },
      { provide: ObterDistribuicaoUseCase, useValue: obter },
      { provide: BuscarBeneficiariosUseCase, useValue: beneficiarios },
      { provide: ListarModelosUseCase, useValue: modelos },
      {
        provide: SessionFacade,
        useValue: { hasPermission: (p: string) => permissions.includes(p) },
      },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: convertToParamMap({ id: '3' }) } },
      },
      ...[AbrirDistribuicaoUseCase, EncerrarDistribuicaoUseCase, RemarcarDistribuicaoUseCase].map(
        (provide) => ({ provide, useValue: { execute: vi.fn() } }),
      ),
    ],
  });
  const fixture = TestBed.createComponent(CestasAdicionaisComponent),
    page = fixture.componentInstance;
  fixture.componentRef.setInput('distribuicao', d);
  fixture.detectChanges();
  await vi.waitFor(() => expect(page.loading()).toBe(false));
  return { fixture, page, api, obter, beneficiarios, modelos, response };
}
async function fill(page: CestasAdicionaisComponent) {
  await page.abrirFormulario();
  page.form.setValue({
    beneficiarioId: '1',
    modeloCestaId: '2',
    quantidade: 2,
    justificativa: '  Necessidade avaliada  ',
  });
}
describe('Cesta adicional no contexto da distribuição', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });
  it('consulta exibe nomes, modelo, justificativa e autorizador', async () => {
    const { fixture, api } = await setup();
    fixture.detectChanges();
    expect(api.listar).toHaveBeenCalledWith('3');
    for (const text of [
      'Ana Silva',
      'Especial',
      'Necessidade avaliada',
      'coordenador',
      'AUTORIZADA',
    ])
      expect(fixture.nativeElement.textContent).toContain(text);
  });
  it('vazio e erro têm retry real', async () => {
    const { page, api, fixture } = await setup();
    api.listar.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 500 })));
    await page.carregar();
    expect(page.error()).toBeTruthy();
    api.listar.mockReturnValue(of([]));
    await page.carregar();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nenhuma cesta');
    expect(api.listar).toHaveBeenCalledTimes(3);
  });
  it('seleção apresenta nomes e documento mascarado; limpar beneficiário impede reuso', async () => {
    const { page, fixture, api } = await setup();
    await fill(page);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('select').textContent).toContain('Ana Silva');
    expect(fixture.nativeElement.querySelector('select').textContent).toContain('***123');
    page.form.controls.beneficiarioId.setValue('');
    await page.autorizar();
    expect(api.autorizar).not.toHaveBeenCalled();
  });
  it('autoriza uma vez, preserva dados antes do HTTP e recarrega após sucesso', async () => {
    const { page, api, response, obter } = await setup();
    await fill(page);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const pending = page.autorizar();
    await page.autorizar();
    expect(confirm).toHaveBeenCalledOnce();
    expect(api.autorizar).toHaveBeenCalledExactlyOnceWith('3', {
      beneficiarioId: '1',
      modeloCestaId: '2',
      quantidade: 2,
      justificativa: 'Necessidade avaliada',
    });
    expect(page.form.controls.beneficiarioId.value).toBe('1');
    response.next(row);
    response.complete();
    await pending;
    expect(api.listar).toHaveBeenCalledTimes(2);
    expect(obter.execute).toHaveBeenCalledTimes(2);
    expect(page.form.controls.beneficiarioId.value).toBe('');
    expect(api.entregar).not.toHaveBeenCalled();
    expect(page.feedback()).toContain('autorizada');
  });
  it('entrega uma vez e reflete resposta consultada, sem descontar saldo local', async () => {
    const { page, api, obter, response, fixture } = await setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const pending = page.entregar('7');
    await page.entregar('7');
    expect(api.entregar).toHaveBeenCalledExactlyOnceWith('7');
    expect(page.items()[0]?.status).toBe('AUTORIZADA');
    expect(page.atual()?.cestasDisponiveis).toBe(5);
    const delivered: CestaAdicional = {
      ...row,
      status: 'ENTREGUE',
      entrega: { usuario: { id: '9', login: 'entregador' }, entregueEm: '2026-09-07T13:00:00Z' },
    };
    api.listar.mockReturnValue(of([delivered]));
    obter.execute.mockReturnValue(of({ ...d, cestasConsumidas: 2, cestasDisponiveis: 3 }));
    const emit = vi.spyOn(page.distribuicaoAtualizada, 'emit');
    response.next(delivered);
    response.complete();
    await pending;
    expect(page.atual()?.cestasDisponiveis).toBe(3);
    expect(emit).toHaveBeenCalledWith(expect.objectContaining({ cestasDisponiveis: 3 }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('entregador');
    expect(fixture.nativeElement.textContent).toContain('ENTREGUE');
  });
  it.each(['autorizar', 'entregar'] as const)(
    'cancelar confirmação não envia %s',
    async (action) => {
      const { page, api } = await setup();
      await fill(page);
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      if (action === 'autorizar') await page.autorizar();
      else await page.entregar('7');
      expect(api[action]).not.toHaveBeenCalled();
    },
  );
  it('autorizador sem retirada não lista nem entrega; mostra retorno da autorização', async () => {
    const { page, api, response } = await setup(all.filter((p) => p !== 'RETIRADA_REGISTRAR'));
    expect(api.listar).not.toHaveBeenCalled();
    await fill(page);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const pending = page.autorizar();
    response.next(row);
    response.complete();
    await pending;
    expect(page.ultimaAutorizacao()).toEqual(row);
    await page.entregar('7');
    expect(api.entregar).not.toHaveBeenCalled();
    expect(api.listar).not.toHaveBeenCalled();
  });
  it('entregador sem autorização ou permission de modelos consulta e entrega sem catálogos', async () => {
    const { page, api, modelos, beneficiarios, response } = await setup([
      'BENEFICIARIO_VISUALIZAR',
      'RETIRADA_REGISTRAR',
    ]);
    await page.abrirFormulario();
    await page.autorizar();
    expect(api.autorizar).not.toHaveBeenCalled();
    expect(modelos.execute).not.toHaveBeenCalled();
    expect(beneficiarios.execute).not.toHaveBeenCalled();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const pending = page.entregar('7');
    response.next({ ...row, status: 'ENTREGUE' });
    response.complete();
    await pending;
    expect(api.entregar).toHaveBeenCalledOnce();
  });
  it('falta de acesso aos catálogos não inventa entrada por IDs', async () => {
    const { page, fixture, modelos, api } = await setup([
      'BENEFICIARIO_VISUALIZAR',
      'CESTA_ADICIONAL_AUTORIZAR',
    ]);
    await page.abrirFormulario();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('solicite acesso');
    expect(modelos.execute).not.toHaveBeenCalled();
    await page.autorizar();
    expect(api.autorizar).not.toHaveBeenCalled();
  });
  it.each([0, -1, 1.5])('quantidade inválida %s não envia', async (quantidade) => {
    const { page, api } = await setup();
    await fill(page);
    page.form.controls.quantidade.setValue(quantidade);
    await page.autorizar();
    expect(api.autorizar).not.toHaveBeenCalled();
  });
  it('justificativa em branco não envia', async () => {
    const { page, api } = await setup();
    await fill(page);
    page.form.controls.justificativa.setValue('   ');
    await page.autorizar();
    expect(api.autorizar).not.toHaveBeenCalled();
    expect(page.mutationError()).toContain('justificativa');
  });
  it.each(['ENTREGUE', 'CANCELADA'] as const)(
    'estado %s não permite entrega nem inventa cancelamento',
    async (status) => {
      const { page, api, fixture } = await setup();
      api.listar.mockReturnValue(of([{ ...row, status }]));
      await page.carregar();
      await page.entregar('7');
      fixture.detectChanges();
      expect(api.entregar).not.toHaveBeenCalled();
      expect(fixture.nativeElement.textContent).toContain(status);
      expect(fixture.nativeElement.textContent).not.toContain('Cancelar cesta');
    },
  );
  it('encerramento impede comandos na UX e mantém consulta', async () => {
    const { page, api, obter } = await setup();
    obter.execute.mockReturnValue(of({ ...d, status: 'ENCERRADA' }));
    await page.carregar();
    await page.abrirFormulario();
    await page.autorizar();
    await page.entregar('7');
    expect(api.autorizar).not.toHaveBeenCalled();
    expect(api.entregar).not.toHaveBeenCalled();
    expect(page.items()).toHaveLength(1);
  });
  it('409 de autorização preserva formulário e reconsulta encerramento', async () => {
    const { page, api, obter, response } = await setup();
    await fill(page);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const pending = page.autorizar();
    obter.execute.mockReturnValue(of({ ...d, status: 'ENCERRADA' }));
    response.error(
      new HttpErrorResponse({
        status: 409,
        error: { error: { code: 'DISTRIBUICAO_ENCERRADA', message: 'SQL interno' } },
      }),
    );
    await pending;
    expect(page.form.controls.beneficiarioId.value).toBe('1');
    expect(page.mutationError()).toContain('encerrada');
    expect(page.mutationError()).toContain('outra operação');
    expect(page.mutationError()).not.toContain('SQL');
    expect(page.atual()?.status).toBe('ENCERRADA');
    expect(api.listar).toHaveBeenCalledTimes(2);
    expect(page.saving()).toBe(false);
  });
  it('409 de entrega reconsulta sem presumir consumo', async () => {
    const { page, api, response, obter } = await setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const pending = page.entregar('7');
    response.error(
      new HttpErrorResponse({ status: 409, error: { error: { code: 'SEM_CESTA_DISPONIVEL' } } }),
    );
    await pending;
    expect(api.listar).toHaveBeenCalledTimes(2);
    expect(obter.execute).toHaveBeenCalledTimes(2);
    expect(page.items()[0]?.status).toBe('AUTORIZADA');
    expect(page.atual()?.cestasDisponiveis).toBe(5);
    expect(page.feedback()).toBe('');
  });
  it.each([true, false])(
    'componente integrado à distribuição respeita permissions: %s',
    async (allowed) => {
      await setup(allowed ? all : ['BENEFICIARIO_VISUALIZAR']);
      const fixture = TestBed.createComponent(DetailPage);
      fixture.detectChanges();
      expect(!!fixture.nativeElement.querySelector('app-cestas-adicionais')).toBe(allowed);
    },
  );
});
