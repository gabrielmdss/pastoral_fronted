import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { APP_CONFIG } from '../../config/app-config';
import { CompetenciasApiService } from './competencias-api.service';
import { COMPETENCIAS_API } from '../../../application/competencias/competencias-api.port';
import { GerarCompetenciaUseCase, ListarCompetenciasUseCase, ObterCompetenciaUseCase } from '../../../application/competencias/competencias.use-cases';
import { DistribuicoesApiService } from '../distribuicoes/distribuicoes-api.service';
import { DISTRIBUICOES_API } from '../../../application/distribuicoes/distribuicoes-api.port';
import { RemarcarDistribuicaoUseCase } from '../../../application/distribuicoes/remarcar-distribuicao.use-case';

const item = { id: '7', ano: 2026, mes: 9, status: 'ABERTA', distribuicoes: 2, direitos: 40 };
describe('contratos reais de competências e remarcação', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(), CompetenciasApiService, DistribuicoesApiService,
      ListarCompetenciasUseCase, ObterCompetenciaUseCase, GerarCompetenciaUseCase, RemarcarDistribuicaoUseCase,
      { provide: COMPETENCIAS_API, useExisting: CompetenciasApiService },
      { provide: DISTRIBUICOES_API, useExisting: DistribuicoesApiService },
      { provide: APP_CONFIG, useValue: { apiBaseUrl: '/api/v1' } },
    ] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('lista sem filtros e desembrulha data; detalhe preserva os campos retornados', () => {
    TestBed.inject(ListarCompetenciasUseCase).execute().subscribe(items => expect(items).toEqual([item]));
    const list = http.expectOne('/api/v1/competencias');
    expect(list.request.method).toBe('GET');
    expect(list.request.params.keys()).toEqual([]);
    list.flush({ data: [item] });
    TestBed.inject(ObterCompetenciaUseCase).execute('7').subscribe(value => expect(value).toEqual(item));
    http.expectOne('/api/v1/competencias/7').flush({ data: item });
  });
  it('gera com somente ano/mês numéricos e recebe 201 com data', () => {
    TestBed.inject(GerarCompetenciaUseCase).execute({ ano: 2026, mes: 9 }).subscribe(value => expect(value).toEqual(item));
    const req = http.expectOne('/api/v1/competencias/gerar');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ ano: 2026, mes: 9 });
    req.flush({ data: item }, { status: 201, statusText: 'Created' });
  });
  it('remarca com somente novaData/motivo e aceita 204 vazio', () => {
    let completed = false;
    TestBed.inject(RemarcarDistribuicaoUseCase).execute('8', { novaData: '2026-09-19', motivo: 'Alteração local' })
      .subscribe({ complete: () => completed = true });
    const req = http.expectOne('/api/v1/distribuicoes/8/remarcar');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ novaData: '2026-09-19', motivo: 'Alteração local' });
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(completed).toBe(true);
  });
});
