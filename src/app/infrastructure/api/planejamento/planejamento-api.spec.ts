import { provideHttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { APP_CONFIG } from '../../config/app-config';
import { PlanejamentoApiService } from './planejamento-api.service';
import * as U from '../../../application/planejamento/planejamento.use-cases';
import { PLANEJAMENTO_API } from '../../../application/planejamento/planejamento-api.port';
import { mapPlanejamento, mapPlanejamentoDetalhe, mapSimulacao } from './planejamento-api.mapper';
import { userErrorMessage } from '../../../shared/errors/user-error';
import type { PlanejamentoDetalheDto, SimulacaoDto } from './planejamento-api.contracts';

const input = { competenciaId: '2', modeloCestaVersaoId: '4', quantidade: 12 };
const plan = {
  id: '7',
  competenciaId: '2',
  ano: 2026,
  mes: 9,
  modeloCestaId: '3',
  modelo: 'Regular',
  criadoEm: '2026-09-01T12:00:00Z',
};
const detail: PlanejamentoDetalheDto = {
  ...plan,
  versoes: [
    {
      id: '8',
      numeroVersao: 1,
      quantidadePlanejada: 12,
      status: 'SIMULACAO',
      usuarioAprovadorId: null,
      aprovadoEm: null,
      motivoRevisao: null,
      itens: [
        { apresentacaoInsumoId: '5', quantidadePorCesta: 2, reservado: null, consumido: null },
      ],
    },
  ],
};
const sim: SimulacaoDto = {
  ...input,
  capacidadeMaxima: 4,
  cobertura: 0.3333,
  itensLimitantes: ['5'],
  itens: [
    {
      apresentacaoInsumoId: '5',
      insumo: 'Arroz',
      apresentacao: '1 kg',
      quantidadePorCesta: 2,
      necessidade: 24,
      saldoFisico: 30,
      saldoReservado: 22,
      saldoDisponivel: 8,
      deficit: 16,
      capacidade: 4,
    },
  ],
};
describe('Planejamento: contracts, mapper e use cases HTTP', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        PlanejamentoApiService,
        ...Object.values(U),
        { provide: PLANEJAMENTO_API, useExisting: PlanejamentoApiService },
        { provide: APP_CONFIG, useValue: { apiBaseUrl: '/api' } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('preserva datas, nulls, quantidades e saldos sem recalcular', () => {
    expect(mapPlanejamento(plan)).toEqual(plan);
    expect(mapPlanejamentoDetalhe(detail)).toEqual(detail);
    const unusual = { ...sim, capacidadeMaxima: 3, cobertura: 0.21 };
    expect(mapSimulacao(unusual)).toEqual(unusual);
    expect(mapSimulacao(unusual).itens).not.toBe(unusual.itens);
  });
  it('listagem não inventa filtros; detalhe usa ID do planejamento', () => {
    TestBed.inject(U.ListarPlanejamentosUseCase)
      .execute()
      .subscribe((p) => expect(p).toEqual([plan]));
    const list = http.expectOne('/api/planejamentos');
    expect(list.request.method).toBe('GET');
    expect(list.request.params.keys()).toEqual([]);
    list.flush({ data: [plan] });
    TestBed.inject(U.ObterPlanejamentoUseCase)
      .execute('7')
      .subscribe((p) => expect(p).toEqual(detail));
    http.expectOne('/api/planejamentos/7').flush({ data: detail });
  });
  it('consulta inexistente aceita o data:null retornado pelo controller', () => {
    TestBed.inject(U.ObterPlanejamentoUseCase)
      .execute('99')
      .subscribe((p) => expect(p).toBeNull());
    http.expectOne('/api/planejamentos/99').flush({ data: null });
  });
  it('simulação é POST com três campos e resposta HTTP 200', () => {
    TestBed.inject(U.SimularPlanejamentoUseCase)
      .execute(input)
      .subscribe((p) => expect(p).toEqual(sim));
    const r = http.expectOne('/api/planejamentos/simular');
    expect(r.request.method).toBe('POST');
    expect(r.request.body).toEqual(input);
    r.flush({ data: sim });
  });
  it('criação recebe IDs de planejamento e versão, sem aprovar automaticamente', () => {
    TestBed.inject(U.CriarPlanejamentoUseCase)
      .execute(input)
      .subscribe((r) => expect(r).toEqual({ id: '7', versaoId: '8' }));
    const r = http.expectOne('/api/planejamentos');
    expect(r.request.body).toEqual(input);
    r.flush({ data: { id: '7', versaoId: '8' } }, { status: 201, statusText: 'Created' });
    http.expectNone('/api/planejamentos/7/aprovar');
  });
  it('revisão envia somente quantidade, versão do modelo e motivo', () => {
    const revisao = { quantidade: 6, modeloCestaVersaoId: '4', motivo: 'Ajustar produção' };
    TestBed.inject(U.RevisarPlanejamentoUseCase)
      .execute('7', revisao)
      .subscribe((r) => expect(r.versaoId).toBe('9'));
    const r = http.expectOne('/api/planejamentos/7/revisoes');
    expect(r.request.method).toBe('POST');
    expect(r.request.body).toEqual(revisao);
    r.flush({ data: { versaoId: '9' } }, { status: 201, statusText: 'Created' });
  });
  it('aprovação usa ID do planejamento, corpo vazio e resposta 204', () => {
    let complete = false;
    TestBed.inject(U.AprovarPlanejamentoUseCase)
      .execute('7')
      .subscribe({ complete: () => (complete = true) });
    const r = http.expectOne('/api/planejamentos/7/aprovar');
    expect(r.request.method).toBe('POST');
    expect(r.request.body).toEqual({});
    r.flush(null, { status: 204, statusText: 'No Content' });
    expect(complete).toBe(true);
  });
  it.each([
    ['SALDO_INSUFICIENTE', 'insuficiente'],
    ['PLANEJAMENTO_NAO_ENCONTRADO', 'não encontrado'],
    ['PLANEJAMENTO_SEM_VERSAO_PENDENTE', 'pendente'],
    ['MODELO_VERSAO_NAO_ENCONTRADO', 'não foi encontrada'],
    ['MODELO_VERSAO_INCOMPATIVEL', 'pertencente'],
    ['CONCORRENCIA_REPETIR', 'outra operação'],
    ['RECURSO_OCUPADO', 'ocupado'],
  ])('traduz o código real %s sem expor SQL', (code, expected) => {
    const e = new HttpErrorResponse({
      status: 409,
      error: { error: { code, message: 'SQL interno' } },
    });
    expect(userErrorMessage(e)).toContain(expected);
    expect(userErrorMessage(e)).not.toContain('SQL');
  });
});
