import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { APP_CONFIG } from '../../config/app-config';
import { AtendimentoApiService } from './atendimento-api.service';

describe('AtendimentoApiService - retiradas', () => {
  let http: HttpTestingController;
  let service: AtendimentoApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AtendimentoApiService,
        { provide: APP_CONFIG, useValue: { apiBaseUrl: 'http://localhost:3101/api/v1' } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(AtendimentoApiService);
  });

  afterEach(() => http.verify());

  it('lista retiradas da distribuição', () => {
    let total = -1;
    service.listarRetiradas('3').subscribe((retiradas) => total = retiradas.length);

    const request = http.expectOne('http://localhost:3101/api/v1/distribuicoes/3/retiradas');
    expect(request.request.method).toBe('GET');
    request.flush({ data: [] });
    expect(total).toBe(0);
  });

  it('registra retirada titular com o payload real', () => {
    service.registrarRetirada('3', {
      beneficiarioId: '1', tipo: 'TITULAR', formaIdentificacao: 'DOCUMENTO',
      representante: null, justificativaExcecao: null,
    }).subscribe();

    const request = http.expectOne('http://localhost:3101/api/v1/distribuicoes/3/retiradas');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      beneficiarioId: '1',
      tipo: 'TITULAR',
      formaIdentificacao: 'DOCUMENTO',
      representante: null,
      justificativaExcecao: null,
    });
    request.flush({ data: { id: '16' } });
  });

  it('registra representante e estorna pelos endpoints reais', () => {
    service.registrarRetirada('3', {
      beneficiarioId: '1', tipo: 'REPRESENTANTE', formaIdentificacao: 'REPRESENTANTE',
      representante: {
        nome: 'Maria', documento: null, relacao: null, autorizacaoDeclaratoria: true,
      },
      justificativaExcecao: null,
    }).subscribe();
    const registro = http.expectOne('http://localhost:3101/api/v1/distribuicoes/3/retiradas');
    expect(registro.request.body).toEqual({
      beneficiarioId: '1', tipo: 'REPRESENTANTE', formaIdentificacao: 'REPRESENTANTE',
      representante: {
        nome: 'Maria', documento: null, relacao: null, autorizacaoDeclaratoria: true,
      },
      justificativaExcecao: null,
    });
    registro.flush({ data: { id: '17' } });

    service.estornarRetirada('17', 'Erro operacional').subscribe();
    const estorno = http.expectOne('http://localhost:3101/api/v1/retiradas/17/estornar');
    expect(estorno.request.method).toBe('POST');
    expect(estorno.request.body).toEqual({ motivo: 'Erro operacional' });
    estorno.flush(null);
  });

  it('consulta histórico, registra e avalia justificativa pelos contratos reais', () => {
    service.listarAusenciasBeneficiario('1').subscribe();
    const historico = http.expectOne('http://localhost:3101/api/v1/beneficiarios/1/historico');
    expect(historico.request.method).toBe('GET');
    historico.flush({ data: { beneficiario: { id: '1', nome: 'Maria' }, eventos: [] } });

    service.registrarJustificativa('8', {
      descricao: 'Internação', momento: 'DEPOIS_DISTRIBUICAO',
    }).subscribe();
    const registro = http.expectOne('http://localhost:3101/api/v1/ausencias/8/justificativas');
    expect(registro.request.body).toEqual({ descricao: 'Internação', momento: 'DEPOIS_DISTRIBUICAO' });
    registro.flush({ data: { id: '9' } });

    service.avaliarJustificativa('9', { decisao: 'ACEITA', observacao: null }).subscribe();
    const avaliacao = http.expectOne('http://localhost:3101/api/v1/justificativas/9/avaliar');
    expect(avaliacao.request.method).toBe('POST');
    expect(avaliacao.request.body).toEqual({ decisao: 'ACEITA', observacao: null });
    avaliacao.flush(null);
  });
});
