import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { APP_CONFIG } from '../../config/app-config';
import { AuditoriaApiService } from './auditoria-api.service';
const registro = {
  id: '10',
  usuario: { id: '1', login: 'admin' },
  entidade: 'DOADOR',
  entidadeId: '4',
  operacao: 'CRIACAO',
  motivo: null,
  ocorridoEm: '2026-09-01T10:00:00.000Z',
  possuiEstadoAnterior: false,
  possuiEstadoNovo: true,
};
describe('Auditoria HTTP', () => {
  let api: AuditoriaApiService, http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuditoriaApiService,
        { provide: APP_CONFIG, useValue: { apiBaseUrl: '/api' } },
      ],
    });
    api = TestBed.inject(AuditoriaApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('lista com filtros do backend e omite vazios', () => {
    const meta = { page: 2, limit: 20, total: 21, totalPages: 2 };
    api
      .listar({ page: 2, limit: 20, entidade: 'DOADOR', operacao: '', dataInicio: '2026-09-01' })
      .subscribe((r) => expect(r).toEqual({ data: [registro], meta }));
    const req = http.expectOne((r) => r.url === '/api/auditoria');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().sort()).toEqual(['dataInicio', 'entidade', 'limit', 'page']);
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('entidade')).toBe('DOADOR');
    req.flush({ data: [registro], meta });
  });
  it('obtém detalhe com estados sanitizados', () => {
    const base: Partial<typeof registro> = { ...registro };
    delete base.possuiEstadoAnterior;
    delete base.possuiEstadoNovo;
    const detalhe = { ...base, usuario: null, estadoAnterior: null, estadoNovo: { nome: 'Ana' } };
    api.obter('10').subscribe((d) => {
      expect(d.usuario).toBeNull();
      expect(d.estadoNovo).toEqual({ nome: 'Ana' });
      expect(d.estadoAnterior).toBeNull();
    });
    http.expectOne('/api/auditoria/10').flush({ data: detalhe });
  });
});
