import { provideRouter } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ListarCheckInsUseCase } from '../../../application/atendimento/use-cases/listar-check-ins.use-case';
import { RegistrarCheckInUseCase } from '../../../application/atendimento/use-cases/registrar-check-in.use-case';
import { ListarRetiradasUseCase } from '../../../application/atendimento/use-cases/listar-retiradas.use-case';
import { RegistrarRetiradaUseCase } from '../../../application/atendimento/use-cases/registrar-retirada.use-case';
import { EstornarRetiradaUseCase } from '../../../application/atendimento/use-cases/estornar-retirada.use-case';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import { BuscarBeneficiariosUseCase } from '../../../application/beneficiarios/beneficiarios.use-cases';
import { ObterDistribuicaoUseCase } from '../../../application/distribuicoes/obter-distribuicao.use-case';
import { EncerrarDistribuicaoUseCase } from '../../../application/distribuicoes/encerrar-distribuicao.use-case';
import { ListarAusenciasBeneficiarioUseCase } from '../../../application/atendimento/use-cases/listar-ausencias-beneficiario.use-case';
import { RegistrarJustificativaUseCase } from '../../../application/atendimento/use-cases/registrar-justificativa.use-case';
import { AvaliarJustificativaUseCase } from '../../../application/atendimento/use-cases/avaliar-justificativa.use-case';
import type { CheckIn } from '../../../domain/atendimento/check-in.model';
import type { BeneficiarioResumo } from '../../../domain/beneficiarios/beneficiario.model';
import type { Distribuicao } from '../../../domain/distribuicoes/distribuicao.model';
import AtendimentoDistribuicaoPage from './atendimento-distribuicao.page';

const distribuicao: Distribuicao = {
  id: '1',
  status: 'ABERTA',
  dataPrevista: '2026-09-04',
  dataReal: null,
  competencia: { id: '9', ano: 2026, mes: 9 },
  grupo: { id: '2', codigo: 'A', nome: 'Grupo A' },
  previstos: 4,
  checkIns: 3,
  regularesPresentes: 2,
  pendentesPresentes: 1,
  retiradas: 0,
  ausentes: 0,
  naoAtendidosEstoque: 0,
  naoAtendidosIrregularidade: 0,
  cestasLiberadas: 4,
  cestasConsumidas: 0,
  cestasRetornadas: 0,
  cestasDisponiveis: 4,
};

function checkIn(overrides: Partial<CheckIn> & Pick<CheckIn, 'id'>): CheckIn {
  return {
    beneficiario: { id: overrides.id, nomeCompleto: `Beneficiário ${overrides.id}` },
    classificacao: 'REGULAR',
    fila: 'PRINCIPAL',
    situacaoOperacional: 'AGUARDANDO',
    podeRetirar: true,
    motivoBloqueio: null,
    pendencias: [],
    ocorridoEm: '2026-09-04T12:00:00.000Z',
    ...overrides,
  };
}

function setup(options?: {
  listar?: ReturnType<typeof vi.fn>;
  buscar?: ReturnType<typeof vi.fn>;
  registrar?: ReturnType<typeof vi.fn>;
  obter?: ReturnType<typeof vi.fn>;
  listarRetiradas?: ReturnType<typeof vi.fn>;
  registrarRetirada?: ReturnType<typeof vi.fn>;
  estornarRetirada?: ReturnType<typeof vi.fn>;
  permissions?: string[];
  userId?: string;
  encerrar?: ReturnType<typeof vi.fn>;
  listarAusencias?: ReturnType<typeof vi.fn>;
  registrarJustificativa?: ReturnType<typeof vi.fn>;
  avaliarJustificativa?: ReturnType<typeof vi.fn>;
}) {
  const listar = options?.listar ?? vi.fn().mockReturnValue(of([]));
  const buscar = options?.buscar ?? vi.fn().mockReturnValue(of([]));
  const registrar = options?.registrar ?? vi.fn();
  const obter = options?.obter ?? vi.fn().mockReturnValue(of(distribuicao));
  const listarRetiradas = options?.listarRetiradas ?? vi.fn().mockReturnValue(of([]));
  const registrarRetirada = options?.registrarRetirada ?? vi.fn();
  const estornarRetirada = options?.estornarRetirada ?? vi.fn();
  const permissions = options?.permissions ?? ['RETIRADA_REGISTRAR'];
  const encerrar = options?.encerrar ?? vi.fn();
  const listarAusencias = options?.listarAusencias ?? vi.fn().mockReturnValue(of([]));
  const registrarJustificativa = options?.registrarJustificativa ?? vi.fn();
  const avaliarJustificativa = options?.avaliarJustificativa ?? vi.fn();

  TestBed.configureTestingModule({
    imports: [AtendimentoDistribuicaoPage],
    providers: [
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } },
      },
      { provide: ObterDistribuicaoUseCase, useValue: { execute: obter } },
      { provide: ListarCheckInsUseCase, useValue: { execute: listar } },
      { provide: BuscarBeneficiariosUseCase, useValue: { execute: buscar } },
      { provide: RegistrarCheckInUseCase, useValue: { execute: registrar } },
      { provide: ListarRetiradasUseCase, useValue: { execute: listarRetiradas } },
      { provide: RegistrarRetiradaUseCase, useValue: { execute: registrarRetirada } },
      { provide: EncerrarDistribuicaoUseCase, useValue: { execute: encerrar } },
      { provide: EstornarRetiradaUseCase, useValue: { execute: estornarRetirada } },
      { provide: ListarAusenciasBeneficiarioUseCase, useValue: { execute: listarAusencias } },
      { provide: RegistrarJustificativaUseCase, useValue: { execute: registrarJustificativa } },
      { provide: AvaliarJustificativaUseCase, useValue: { execute: avaliarJustificativa } },
      {
        provide: SessionFacade,
        useValue: {
          currentUser: () => ({ id: options?.userId ?? '4' }),
          hasPermission: (permission: string) => permissions.includes(permission),
        },
      },
    ],
  });

  const fixture = TestBed.createComponent(AtendimentoDistribuicaoPage);
  const page = fixture.componentInstance;
  return { fixture, page, listar, buscar, registrar, obter, listarRetiradas, registrarRetirada, estornarRetirada, encerrar, listarAusencias, registrarJustificativa, avaliarJustificativa };
}

describe('AtendimentoDistribuicaoPage', () => {
  it.each([
    { permissions: ['BENEFICIARIO_VISUALIZAR', 'DISTRIBUICAO_TRIAGEM'], visible: false },
    { permissions: ['BENEFICIARIO_VISUALIZAR', 'DISTRIBUICAO_TRIAGEM', 'RETIRADA_REGISTRAR'], visible: true },
    { permissions: ['BENEFICIARIO_VISUALIZAR', 'DISTRIBUICAO_TRIAGEM', 'CESTA_ADICIONAL_AUTORIZAR'], visible: true },
  ])('acesso contextual a cestas adicionais respeita permissions: $visible', ({ permissions, visible }) => {
    const { fixture } = setup({ permissions });
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('a[href="/distribuicoes/1#cestas-adicionais"]');
    expect(Boolean(link)).toBe(visible);
  });
  it('triagem sem permission de retirada não consulta nem registra entregas', () => {
    const { fixture, page, listarRetiradas, registrarRetirada } = setup({
      permissions: ['BENEFICIARIO_VISUALIZAR', 'DISTRIBUICAO_TRIAGEM'],
    });
    const apto = checkIn({ id: '8' });
    page.filaRegular.set([apto]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Retiradas da distribuição');
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    expect(buttons.filter(b => /Entregar cesta|Representante/.test(b.textContent ?? '')).every(b => b.disabled)).toBe(true);
    page.carregarRetiradas();
    page.registrarRetiradaTitular(apto);
    page.registrarRetiradaRepresentante(apto);
    expect(listarRetiradas).not.toHaveBeenCalled();
    expect(registrarRetirada).not.toHaveBeenCalled();
  });

  it('histórico encerrado mantém consultas e bloqueia check-in e entregas', () => {
    const { fixture, page, registrar, registrarRetirada, listarRetiradas, listar } = setup({
      obter: vi.fn().mockReturnValue(of({ ...distribuicao, status: 'ENCERRADA' })),
      permissions: ['RETIRADA_REGISTRAR', 'DISTRIBUICAO_TRIAGEM', 'BENEFICIARIO_VISUALIZAR'],
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Histórico de check-ins');
    expect(listar).toHaveBeenCalledWith('1');
    expect(listarRetiradas).toHaveBeenCalledOnce();
    page.registrarChegada({ id: '8', nomeCompleto: 'Ana', status: 'ATIVO', grupo: null, fotoPrincipal: null, documentos: [] });
    page.registrarRetiradaTitular(checkIn({ id: '8' }));
    page.registrarRetiradaRepresentante(checkIn({ id: '8' }));
    expect(registrar).not.toHaveBeenCalled();
    expect(registrarRetirada).not.toHaveBeenCalled();
  });
  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('registra e avalia justificativa com permissions e atualiza filas e resumo', () => {
    const listarAusencias = vi.fn().mockReturnValue(of([{
      id: '8', status: 'SEM_JUSTIFICATIVA', competenciaId: '7',
      ocorridoEm: '2026-08-01T12:00:00.000Z', justificativas: [],
    }]));
    const registrarJustificativa = vi.fn().mockReturnValue(of({ id: '9' }));
    const avaliarJustificativa = vi.fn().mockReturnValue(of(void 0));
    const { page, listar, obter } = setup({
      listarAusencias, registrarJustificativa, avaliarJustificativa,
      permissions: ['JUSTIFICATIVA_REGISTRAR', 'JUSTIFICATIVA_AVALIAR'],
    });
    vi.spyOn(window, 'prompt')
      .mockReturnValueOnce('Motivo informado')
      .mockReturnValueOnce('DEPOIS_DISTRIBUICAO')
      .mockReturnValueOnce('Analisada');
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    page.carregarAusencias('1');
    const ausencia = page.ausenciasPorBeneficiario()['1']![0]!;
    page.registrarJustificativa('1', ausencia);
    expect(registrarJustificativa).toHaveBeenCalledWith('8', {
      descricao: 'Motivo informado', momento: 'DEPOIS_DISTRIBUICAO',
    });
    const ausenciaRecarregada = {
      ...ausencia,
      justificativas: [{
        id: '9', ausenciaId: '8', decisao: 'PENDENTE' as const,
        momento: 'DEPOIS_DISTRIBUICAO' as const, ocorridoEm: '2026-08-02T00:00:00Z',
      }],
    };
    page.avaliarJustificativa('1', ausenciaRecarregada, 'ACEITA');
    expect(avaliarJustificativa).toHaveBeenCalledWith('9', {
      decisao: 'ACEITA', observacao: 'Analisada',
    });
    expect(listar.mock.calls.length).toBeGreaterThan(2);
    expect(obter.mock.calls.length).toBeGreaterThan(1);
  });

  it('mantém nas filas somente REGULAR e PENDENTE aguardando, aptos ou bloqueados', () => {
    const regularApto = checkIn({ id: 'r1' });
    const regularBloqueado = checkIn({
      id: 'r2',
      podeRetirar: false,
      motivoBloqueio: 'DIREITO_NAO_DISPONIVEL',
    });
    const atendido = checkIn({ id: 'r3', situacaoOperacional: 'ATENDIDO', podeRetirar: false, motivoBloqueio: 'DIREITO_JA_CONSUMIDO' });
    const pendente = checkIn({
      id: 'p1',
      classificacao: 'PENDENTE',
      fila: 'SECUNDARIA',
      podeRetirar: false,
      motivoBloqueio: 'BENEFICIARIO_PENDENTE',
      pendencias: [{ codigo: 'AUSENCIA_ANTERIOR_NAO_REGULARIZADA' }],
    });
    const listar = vi.fn((_id: string, classificacao: string) =>
      of(classificacao === 'REGULAR' ? [regularApto, regularBloqueado, atendido] : [pendente]),
    );

    const { page } = setup({ listar });

    expect(page.filaRegular()).toEqual([regularApto, regularBloqueado]);
    expect(page.filaPendente()).toEqual([pendente]);
    expect(page.motivoBloqueioLabel('DIREITO_NAO_DISPONIVEL')).toBe(
      'Direito previsto para outra distribuição.',
    );
    expect(listar).toHaveBeenCalledWith('1', 'REGULAR', 'AGUARDANDO');
    expect(listar).toHaveBeenCalledWith('1', 'PENDENTE', 'AGUARDANDO');
  });

  it('permite uma nova busca depois de erro', async () => {
    vi.useFakeTimers();
    const beneficiario: BeneficiarioResumo = { id: '2', nomeCompleto: 'Maria', status: 'ATIVO', grupo: null, fotoPrincipal: null, documentos: [] };
    const buscar = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new Error('falha')))
      .mockReturnValueOnce(of([beneficiario]));
    const { page } = setup({ buscar });

    page.onBuscaChange('Maria');
    await vi.advanceTimersByTimeAsync(351);
    expect(page.buscaError()).toBeTruthy();

    page.onBuscaChange('Joana');
    await vi.advanceTimersByTimeAsync(351);
    expect(page.buscaError()).toBeNull();
    expect(page.resultadosBusca()).toEqual([beneficiario]);
  });

  it('após o check-in atualiza feedback, filas e resumo', () => {
    const registrado = checkIn({ id: 'novo' });
    const registrar = vi.fn().mockReturnValue(of(registrado));
    const { page, listar, obter } = setup({ registrar });
    const beneficiario: BeneficiarioResumo = { id: '8', nomeCompleto: 'José', status: 'ATIVO', grupo: null, fotoPrincipal: null, documentos: [] };

    page.registrarChegada(beneficiario);

    expect(registrar).toHaveBeenCalledWith('1', '8');
    expect(page.ultimoCheckIn()).toEqual(registrado);
    expect(listar).toHaveBeenCalledTimes(4);
    expect(obter).toHaveBeenCalledTimes(2);
    expect(page.checkInEmAndamento()).toBe(false);
  });

  it('habilita retirada somente para AGUARDANDO apto', () => {
    const { page } = setup();
    const apto = checkIn({ id: 'apto' });
    const bloqueado = checkIn({ id: 'bloqueado', podeRetirar: false, motivoBloqueio: 'DIREITO_NAO_DISPONIVEL' });
    const atendido = checkIn({ id: 'atendido', situacaoOperacional: 'ATENDIDO' });

    expect(page.podeRegistrarRetirada(apto)).toBe(true);
    expect(page.podeRegistrarRetirada(bloqueado)).toBe(false);
    expect(page.podeRegistrarRetirada(atendido)).toBe(false);
  });

  it('registra retirada titular e atualiza filas, resumo e listagem', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const registrarRetirada = vi.fn().mockReturnValue(of({ id: '16' }));
    const { page, listar, obter, listarRetiradas } = setup({ registrarRetirada });
    const apto = checkIn({ id: 'apto', beneficiario: { id: '8', nomeCompleto: 'José' } });

    page.registrarRetiradaTitular(apto);

    expect(registrarRetirada).toHaveBeenCalledWith('1', '8');
    expect(page.retiradaFeedback()).toContain('José');
    expect(listar).toHaveBeenCalledTimes(4);
    expect(obter).toHaveBeenCalledTimes(2);
    expect(listarRetiradas).toHaveBeenCalledTimes(2);
  });

  it('carrega e expõe as retiradas da distribuição', () => {
    const retirada = {
      id: '16', distribuicaoId: '1', direitoId: '31',
      beneficiario: { id: '8', nomeCompleto: 'José' },
      tipo: 'TITULAR' as const, status: 'VALIDA' as const,
      formaIdentificacao: 'DOCUMENTO' as const, representante: null,
      operador: { id: '4', login: 'admin' }, ocorridoEm: '2026-09-04T14:56:37.851Z',
    };
    const { page } = setup({ listarRetiradas: vi.fn().mockReturnValue(of([retirada])) });

    expect(page.retiradas()).toEqual([retirada]);
    expect(page.loadingRetiradas()).toBe(false);
  });

  it('registra representante com nome e autorização no contrato real', () => {
    vi.spyOn(window, 'prompt').mockReturnValue('Maria Representante');
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const registrarRetirada = vi.fn().mockReturnValue(of({ id: '17' }));
    const { page } = setup({ registrarRetirada });
    const apto = checkIn({ id: 'apto', beneficiario: { id: '8', nomeCompleto: 'José' } });

    page.registrarRetiradaRepresentante(apto);

    expect(registrarRetirada).toHaveBeenCalledWith('1', '8', {
      nome: 'Maria Representante',
      documento: null,
      relacao: null,
      autorizacaoDeclaratoria: true,
    });
  });

  it('respeita permissões de estorno próprio e geral', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-04T15:00:00.000Z'));
    const base = {
      id: '16', distribuicaoId: '1', direitoId: '31',
      beneficiario: { id: '8', nomeCompleto: 'José' },
      tipo: 'TITULAR' as const, status: 'VALIDA' as const,
      formaIdentificacao: 'DOCUMENTO' as const, representante: null,
      operador: { id: '4', login: 'admin' }, ocorridoEm: '2026-09-04T14:56:37.851Z',
    };

    expect(setup({ permissions: ['RETIRADA_ESTORNAR_PROPRIA'], userId: '4' }).page.podeEstornar(base)).toBe(true);
    TestBed.resetTestingModule();
    expect(setup({ permissions: ['RETIRADA_ESTORNAR_PROPRIA'], userId: '9' }).page.podeEstornar(base)).toBe(false);
    TestBed.resetTestingModule();
    expect(setup({ permissions: ['RETIRADA_ESTORNAR_QUALQUER'], userId: '9' }).page.podeEstornar(base)).toBe(true);
  });

  it('estorna com motivo e atualiza histórico, filas e resumo', () => {
    vi.spyOn(window, 'prompt').mockReturnValue('Entrega registrada por engano');
    const estornarRetirada = vi.fn().mockReturnValue(of(undefined));
    const { page, listar, obter, listarRetiradas } = setup({
      estornarRetirada,
      permissions: ['RETIRADA_ESTORNAR_QUALQUER', 'RETIRADA_REGISTRAR'],
    });
    const retirada = {
      id: '16', distribuicaoId: '1', direitoId: '31',
      beneficiario: { id: '8', nomeCompleto: 'José' },
      tipo: 'TITULAR' as const, status: 'VALIDA' as const,
      formaIdentificacao: 'DOCUMENTO' as const, representante: null,
      operador: { id: '4', login: 'admin' }, ocorridoEm: '2026-09-04T14:56:37.851Z',
    };

    page.solicitarEstorno(retirada);

    expect(estornarRetirada).toHaveBeenCalledWith('16', 'Entrega registrada por engano');
    expect(listarRetiradas).toHaveBeenCalledTimes(2);
    expect(listar).toHaveBeenCalledTimes(4);
    expect(obter).toHaveBeenCalledTimes(2);
  });

  it('encerra, reflete ENCERRADA e recarrega filas, resumo, retiradas e histórico', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const encerrada = { ...distribuicao, status: 'ENCERRADA' as const };
    const obter = vi.fn()
      .mockReturnValueOnce(of(distribuicao))
      .mockReturnValueOnce(of(encerrada));
    const encerrar = vi.fn().mockReturnValue(of(undefined));
    const { page, listar, listarRetiradas } = setup({
      obter,
      encerrar,
      permissions: ['DISTRIBUICAO_ENCERRAR', 'RETIRADA_REGISTRAR'],
    });

    page.encerrar();

    expect(encerrar).toHaveBeenCalledOnce();
    expect(page.distribuicao()?.status).toBe('ENCERRADA');
    expect(page.encerrando()).toBe(false);
    expect(listar).toHaveBeenCalledTimes(5);
    expect(listarRetiradas).toHaveBeenCalledTimes(2);
    expect(page.podeRegistrarRetirada(checkIn({ id: 'apto' }))).toBe(false);
  });

  it('não encerra sem permission', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const encerrar = vi.fn().mockReturnValue(of(undefined));
    const { page } = setup({ encerrar });

    page.encerrar();

    expect(encerrar).not.toHaveBeenCalled();
  });
});
