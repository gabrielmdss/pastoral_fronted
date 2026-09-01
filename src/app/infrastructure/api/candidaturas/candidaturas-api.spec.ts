import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { APP_CONFIG } from '../../config/app-config';
import { CandidaturasApiService } from './candidaturas-api.service';
import { mapCandidatura } from './candidaturas-api.mapper';
describe('CandidaturasApiService e mapper', () => {
  let api: CandidaturasApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        CandidaturasApiService,
        { provide: APP_CONFIG, useValue: { apiBaseUrl: 'http://api/v1' } },
      ],
    });
    api = TestBed.inject(CandidaturasApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('preserva documento já mascarado pelo backend', () =>
    expect(
      mapCandidatura({
        id: '1',
        pessoaId: '2',
        nome: 'Ana',
        documentos: [{tipo:'CPF',numeroMascarado:'***.***.***-42'}],
        status: 'AGUARDANDO',
        dataEntrada: '2026-01-01T00:00:00Z',
        prioridadeExcepcional: false,
        tentativasContato: 0,
        ultimaTentativaContato:null,
      }).documentos[0],
    ).toEqual({tipo:'CPF',numeroMascarado:'***.***.***-42'}));
  it('lista com filtros e consome todas as mutações', () => {
    api.listar({ nome: 'Ana' }).subscribe();
    const list = http.expectOne((x) => x.url === 'http://api/v1/candidaturas');
    expect(list.request.params.get('nome')).toBe('Ana');
    list.flush({ data: [] });
    api.criar('2').subscribe();
    expect(http.expectOne('http://api/v1/candidaturas').request.body).toEqual({ pessoaId: '2' });
    api.priorizar('1', 'justificativa válida').subscribe();
    expect(http.expectOne('http://api/v1/candidaturas/1/priorizar').request.method).toBe('POST');
    api.registrarContato('1', { resultado: 'SEM_RESPOSTA', observacao: null }).subscribe();
    expect(http.expectOne('http://api/v1/candidaturas/1/tentativas-contato').request.method).toBe(
      'POST',
    );
    api.marcarNaoLocalizado('1').subscribe();
    expect(http.expectOne('http://api/v1/candidaturas/1/nao-localizado').request.method).toBe(
      'POST',
    );
    api
      .admitir('1', { grupoId: '2', autorizarAcimaCapacidade: false, justificativaExcecao: null })
      .subscribe();
    expect(http.expectOne('http://api/v1/candidaturas/1/admitir').request.method).toBe('POST');
  });
});
