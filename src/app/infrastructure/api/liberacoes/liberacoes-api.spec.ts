import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { APP_CONFIG } from '../../config/app-config';
import { LiberacoesApiService } from './liberacoes-api.service';
import { mapLiberacao } from './liberacoes-api.mapper';
import { LIBERACOES_API } from '../../../application/liberacoes/liberacoes-api.port';
import {
  ListarLiberacoesUseCase,
  LiberarCestasUseCase,
} from '../../../application/liberacoes/liberacoes.use-cases';
import { userErrorMessage } from '../../../shared/errors/user-error';
const row = {
  id: '1',
  loteMontagemId: '2',
  quantidadeLiberada: 10,
  quantidadeConsumida: 2,
  quantidadeRetornada: 3,
  quantidadeDisponivel: 5,
  usuarioId: '8',
  liberadoEm: '2026-09-07T12:00:00Z',
};
describe('Liberações: contratos HTTP', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        LiberacoesApiService,
        ListarLiberacoesUseCase,
        LiberarCestasUseCase,
        { provide: LIBERACOES_API, useExisting: LiberacoesApiService },
        { provide: APP_CONFIG, useValue: { apiBaseUrl: '/api' } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });
  it('mapper preserva cada valor autoritativo sem derivar disponibilidade', () => {
    const unusual = { ...row, quantidadeDisponivel: 4 };
    expect(mapLiberacao(unusual)).toEqual(unusual);
  });
  it('consulta múltiplas liberações sem filtros inventados', () => {
    TestBed.inject(ListarLiberacoesUseCase)
      .execute('3')
      .subscribe((x) => expect(x).toEqual([row, { ...row, id: '4' }]));
    const r = http.expectOne('/api/distribuicoes/3/liberacoes-cestas');
    expect(r.request.method).toBe('GET');
    expect(r.request.params.keys()).toEqual([]);
    r.flush({ data: [row, { ...row, id: '4' }] });
  });
  it('envia somente lote e quantidade, recebe ID em 201', () => {
    TestBed.inject(LiberarCestasUseCase)
      .execute('3', { loteMontagemId: '2', quantidade: 5 })
      .subscribe((x) => expect(x).toEqual({ id: '9' }));
    const r = http.expectOne('/api/distribuicoes/3/liberacoes-cestas');
    expect(r.request.method).toBe('POST');
    expect(r.request.body).toEqual({ loteMontagemId: '2', quantidade: 5 });
    r.flush({ data: { id: '9' } }, { status: 201, statusText: 'Created' });
  });
  it.each([
    'LIBERACAO_INVALIDA',
    'SALDO_INSUFICIENTE',
    'DISTRIBUICAO_ENCERRADA',
    'DISTRIBUICAO_NAO_ENCONTRADA',
    'RECURSO_OCUPADO',
    'CONCORRENCIA_REPETIR',
    'PERMISSAO_NEGADA',
  ])('traduz %s sem SQL', (code) => {
    const message = userErrorMessage(
      new HttpErrorResponse({ status: 409, error: { error: { code, message: 'SQL privado' } } }),
    );
    expect(message).toBeTruthy();
    expect(message).not.toContain('SQL');
    expect(message).not.toContain(code);
  });
});
