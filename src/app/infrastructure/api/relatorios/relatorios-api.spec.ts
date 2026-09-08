import { TestBed } from '@angular/core/testing';
import type { Observable } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { APP_CONFIG } from '../../config/app-config';
import { RELATORIOS_API } from '../../../application/relatorios/relatorios-api.port';
import * as U from '../../../application/relatorios/relatorios.use-cases';
import { RelatoriosApiService } from './relatorios-api.service';
import { mapBeneficiarios, mapDistribuicoes, mapEstoque } from './relatorios-api.mapper';
describe('Relatórios: contratos executáveis', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        RelatoriosApiService,
        ...Object.values(U),
        { provide: RELATORIOS_API, useExisting: RelatoriosApiService },
        { provide: APP_CONFIG, useValue: { apiBaseUrl: '/api' } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });
  it('distribuições usa exatamente os filtros e envelope paginado direto', () => {
    const filters = {
      page: 2,
      limit: 10,
      dataInicio: '2026-09-01',
      dataFim: '2026-09-30',
      competencia: '2026-09',
      grupoId: '3',
      status: 'ENCERRADA' as const,
    };
    const response = { data: [], meta: { page: 2, limit: 10, total: 83, totalPages: 9 } };
    TestBed.inject(U.RelatorioDistribuicoesUseCase)
      .execute(filters)
      .subscribe((r) => expect(r).toEqual(response));
    const r = http.expectOne((req) => req.url === '/api/relatorios/distribuicoes');
    expect(r.request.method).toBe('GET');
    expect(r.request.params.keys().sort()).toEqual(Object.keys(filters).sort());
    for (const [key, value] of Object.entries(filters))
      expect(r.request.params.get(key)).toBe(String(value));
    r.flush(response);
  });
  it('beneficiários usa situação e período de admissão', () => {
    const filters = {
      page: 1,
      limit: 50,
      status: 'DESLIGADO' as const,
      grupoId: '2',
      dataAdmissaoInicio: '2026-01-01',
      dataAdmissaoFim: '2026-09-01',
    };
    TestBed.inject(U.RelatorioBeneficiariosUseCase).execute(filters).subscribe();
    const r = http.expectOne((req) => req.url === '/api/relatorios/beneficiarios');
    expect(r.request.method).toBe('GET');
    expect(r.request.params.keys().sort()).toEqual(Object.keys(filters).sort());
    for (const [key, value] of Object.entries(filters))
      expect(r.request.params.get(key)).toBe(String(value));
    r.flush({ data: [], meta: { page: 1, limit: 50, total: 0, totalPages: 0 } });
  });
  it('estoque envia somente pesquisa, movimento e período', () => {
    const filters = {
      page: 1,
      limit: 100,
      insumo: 'Arroz 1 kg',
      tipoMovimento: 'AJUSTE_INVENTARIO' as const,
      dataInicio: '2026-09-01',
      dataFim: '2026-09-07',
    };
    TestBed.inject(U.RelatorioEstoqueUseCase).execute(filters).subscribe();
    const r = http.expectOne((req) => req.url === '/api/relatorios/estoque');
    expect(r.request.method).toBe('GET');
    expect(r.request.params.keys().sort()).toEqual(Object.keys(filters).sort());
    for (const [key, value] of Object.entries(filters))
      expect(r.request.params.get(key)).toBe(String(value));
    r.flush({ data: [], meta: { page: 1, limit: 100, total: 0, totalPages: 0 } });
  });
  it.each(['distribuicoes', 'beneficiarios', 'estoque'] as const)(
    '%s omite filtros ausentes e consulta novamente sem alteração',
    (tipo) => {
      const api = TestBed.inject(RelatoriosApiService);
      for (let i = 0; i < 2; i++) {
        (api[tipo]({ page: 1, limit: 50 }) as Observable<unknown>).subscribe();
        const r = http.expectOne('/api/relatorios/' + tipo + '?page=1&limit=50');
        r.flush({ data: [], meta: { page: 1, limit: 50, total: 0, totalPages: 0 } });
      }
    },
  );
  it('preserva agregações de estoque sem recalcular saldos', () => {
    const dto = {
      data: [
        {
          apresentacaoInsumoId: '1',
          insumo: 'Arroz',
          apresentacao: '1 kg',
          entradas: 10,
          saidas: 3,
          perdas: 2,
          ajustes: -1,
          saldoPeriodo: 5,
          saldo: 97,
        },
      ],
      meta: { page: 1, limit: 50, total: 71, totalPages: 2 },
    };
    expect(mapEstoque(dto)).toEqual(dto);
    expect(mapEstoque(dto).data).not.toBe(dto.data);
  });
  it('preserva valores nulos e histórico agregado do beneficiário', () => {
    const dto = {
      data: [
        {
          id: '1',
          beneficiario: 'Ana Maria',
          situacaoAtual: 'ATIVO' as const,
          dataAdmissao: '2026-01-01',
          grupoId: null,
          grupo: null,
          ultimaRetirada: null,
          quantidadeRetiradas: 3,
          ausencias: 2,
        },
      ],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    };
    expect(mapBeneficiarios(dto)).toEqual(dto);
  });
  it('preserva contadores de atendimento independentes', () => {
    const dto = {
      data: [
        {
          id: '1',
          data: '2026-09-07',
          status: 'ENCERRADA' as const,
          ano: 2026,
          mes: 9,
          grupoId: '3',
          grupo: 'A',
          previstos: 100,
          presentes: 70,
          retirados: 65,
          ausentes: 20,
          naoAtendidosEstoque: 4,
          naoAtendidosIrregularidade: 1,
          extras: 7,
        },
      ],
      meta: { page: 1, limit: 50, total: 90, totalPages: 2 },
    };
    expect(mapDistribuicoes(dto)).toEqual(dto);
  });
});
