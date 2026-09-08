import { TestBed } from '@angular/core/testing';
import { provideHttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import { APP_CONFIG } from '../../config/app-config';
import { CestasAdicionaisApiService } from './cestas-adicionais-api.service';
import { mapCestaAdicional } from './cestas-adicionais-api.mapper';
import { CESTAS_ADICIONAIS_API } from '../../../application/atendimento/ports/cestas-adicionais-api.port';
import * as U from '../../../application/atendimento/use-cases/cestas-adicionais.use-cases';
import type { CestaAdicionalDto } from './cestas-adicionais-api.contracts';
import { userErrorMessage } from '../../../shared/errors/user-error';
const row: CestaAdicionalDto = {
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
describe('Cesta adicional: contratos executáveis', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        CestasAdicionaisApiService,
        ...Object.values(U),
        { provide: CESTAS_ADICIONAIS_API, useExisting: CestasAdicionaisApiService },
        { provide: APP_CONFIG, useValue: { apiBaseUrl: '/api' } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });
  it.each(['AUTORIZADA', 'ENTREGUE', 'CANCELADA'] as const)(
    'mapper preserva %s, justificativa e dados de entrega',
    (status) => {
      const dto = {
        ...row,
        status,
        entrega:
          status === 'ENTREGUE'
            ? { usuario: { id: '8', login: 'entregador' }, entregueEm: '2026-09-07T13:00:00Z' }
            : null,
      };
      const mapped = mapCestaAdicional(dto);
      expect(mapped).toEqual(dto);
      expect(mapped.modeloCesta).not.toBe(dto.modeloCesta);
      expect(mapped.beneficiario).not.toBe(dto.beneficiario);
    },
  );
  it('lista no contexto sem filtros artificiais', () => {
    TestBed.inject(U.ListarCestasAdicionaisUseCase)
      .execute('3')
      .subscribe((x) => expect(x).toEqual([row]));
    const r = http.expectOne('/api/distribuicoes/3/cestas-adicionais');
    expect(r.request.method).toBe('GET');
    expect(r.request.params.keys()).toEqual([]);
    r.flush({ data: [row] });
  });
  it('autorização envia exatamente quatro campos e recebe registro completo em 201', () => {
    const input = {
      beneficiarioId: '1',
      modeloCestaId: '2',
      quantidade: 2,
      justificativa: 'Necessidade avaliada',
    };
    TestBed.inject(U.AutorizarCestaAdicionalUseCase)
      .execute('3', input)
      .subscribe((x) => expect(x).toEqual(row));
    const r = http.expectOne('/api/distribuicoes/3/cestas-adicionais');
    expect(r.request.method).toBe('POST');
    expect(r.request.body).toEqual(input);
    r.flush({ data: row }, { status: 201, statusText: 'Created' });
  });
  it('entrega usa ID da autorização, corpo vazio e resposta 200 completa', () => {
    const delivered = {
      ...row,
      status: 'ENTREGUE',
      entrega: { usuario: { id: '8', login: 'operador' }, entregueEm: '2026-09-07T13:00:00Z' },
    };
    TestBed.inject(U.EntregarCestaAdicionalUseCase)
      .execute('7')
      .subscribe((x) => expect(x).toEqual(delivered));
    const r = http.expectOne('/api/cestas-adicionais/7/entregar');
    expect(r.request.method).toBe('POST');
    expect(r.request.body).toEqual({});
    r.flush({ data: delivered });
  });
  it.each([
    'MODELO_CESTA_NAO_ENCONTRADO',
    'MODELO_CESTA_INATIVO',
    'CESTA_ADICIONAL_NAO_ENCONTRADA',
    'CESTA_ADICIONAL_NAO_AUTORIZADA',
    'ENTREGA_CESTA_ADICIONAL_INVALIDA',
    'DISTRIBUICAO_ENCERRADA',
    'DISTRIBUICAO_NAO_ABERTA',
    'SEM_CESTA_DISPONIVEL',
    'PERMISSAO_NEGADA',
    'CONCORRENCIA_REPETIR',
  ])('traduz %s sem erro interno', (code) => {
    const message = userErrorMessage(
      new HttpErrorResponse({ status: 409, error: { error: { code, message: 'SQL privado' } } }),
    );
    expect(message).not.toContain('SQL');
    expect(message).not.toContain(code);
    expect(message).toBeTruthy();
  });
});
