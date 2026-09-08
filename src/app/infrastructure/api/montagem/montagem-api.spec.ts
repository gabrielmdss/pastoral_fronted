import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { APP_CONFIG } from '../../config/app-config';
import { MontagemApiService } from './montagem-api.service';
import { mapLote } from './montagem-api.mapper';
import type { LoteMontagemDto } from './montagem-api.contracts';
import { userErrorMessage } from '../../../shared/errors/user-error';
import { MONTAGEM_API } from '../../../application/montagem/montagem-api.port';
import * as U from '../../../application/montagem/montagem.use-cases';

const lote: LoteMontagemDto = {
  id: '9',
  quantidadeMontada: 20,
  quantidadeDisponivel: 11,
  status: 'ATIVO',
  possuiAjustes: false,
  permiteDesmontagemParcial: true,
  podeAjustar: false,
  podeDesmontar: true,
  montadoEm: '2026-09-06T12:00:00Z',
  planejamento: { id: '2', versaoId: '4', numeroVersao: 3 },
  responsavel: { id: '1', login: 'operador' },
  itens: [{ apresentacaoInsumoId: '6', quantidadePorCesta: 2, quantidadeTotal: 40 }],
};
describe('Montagem: contratos executáveis', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MontagemApiService,
        ...Object.values(U),
        { provide: MONTAGEM_API, useExisting: MontagemApiService },
        { provide: APP_CONFIG, useValue: { apiBaseUrl: '/api' } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });
  it('mapper preserva quantidades independentes, composição, responsável e versão', () => {
    const result = mapLote(lote);
    expect(result).toEqual(lote);
    expect(result.itens).not.toBe(lote.itens);
    expect(result.planejamento).not.toBe(lote.planejamento);
  });
  it('backend sem flags não reabilita ações por inferência local', () => {
    const legacy = { ...lote };
    delete legacy.possuiAjustes;
    delete legacy.permiteDesmontagemParcial;
    delete legacy.podeAjustar;
    delete legacy.podeDesmontar;
    const result = mapLote(legacy);
    expect(result.podeAjustar).toBe(false);
    expect(result.podeDesmontar).toBe(false);
    expect(result.permiteDesmontagemParcial).toBe(false);
  });
  it('listagem sem filtros e detalhe usam o mesmo contrato', () => {
    TestBed.inject(U.ListarLotesUseCase)
      .execute()
      .subscribe((x) => expect(x).toEqual([lote]));
    const list = http.expectOne('/api/estoque/lotes-montagem');
    expect(list.request.method).toBe('GET');
    expect(list.request.params.keys()).toEqual([]);
    list.flush({ data: [lote] });
    TestBed.inject(U.ObterLoteUseCase)
      .execute('9')
      .subscribe((x) => expect(x).toEqual(lote));
    http.expectOne('/api/estoque/lotes-montagem/9').flush({ data: lote });
  });
  it('aceita detalhe inexistente com HTTP 200 data null', () => {
    TestBed.inject(U.ObterLoteUseCase)
      .execute('99')
      .subscribe((x) => expect(x).toBeNull());
    http.expectOne('/api/estoque/lotes-montagem/99').flush({ data: null });
  });
  it('monta com ID da versão e quantidade; usuário vem da sessão backend', () => {
    TestBed.inject(U.MontarLoteUseCase)
      .execute({ planejamentoVersaoId: '4', quantidade: 20 })
      .subscribe((x) => expect(x.id).toBe('9'));
    const r = http.expectOne('/api/estoque/lotes-montagem');
    expect(r.request.method).toBe('POST');
    expect(r.request.body).toEqual({ planejamentoVersaoId: '4', quantidade: 20 });
    r.flush({ data: { id: '9' } }, { status: 201, statusText: 'Created' });
  });
  it('contrato de ajuste usa operações e quantidades positivas, resposta 201', () => {
    const input = {
      quantidadeCestasAfetadas: 1,
      motivo: 'Recompor cesta',
      itens: [{ apresentacaoInsumoId: '6', operacao: 'REMOVER' as const, quantidadePorCesta: 1 }],
    };
    TestBed.inject(U.AjustarLoteUseCase)
      .execute('9', input)
      .subscribe((x) => expect(x.id).toBe('10'));
    const r = http.expectOne('/api/estoque/lotes-montagem/9/ajustes');
    expect(r.request.method).toBe('POST');
    expect(r.request.body).toEqual(input);
    r.flush({ data: { id: '10' } }, { status: 201, statusText: 'Created' });
  });
  it('contrato de desmontagem usa quantidade e motivo, resposta 204', () => {
    const input = { quantidade: 2, motivo: 'Devolver insumos' };
    TestBed.inject(U.DesmontarLoteUseCase).execute('9', input).subscribe();
    const r = http.expectOne('/api/estoque/lotes-montagem/9/desmontar');
    expect(r.request.method).toBe('POST');
    expect(r.request.body).toEqual(input);
    r.flush(null, { status: 204, statusText: 'No Content' });
  });
  it.each([
    'MONTAGEM_INVALIDA',
    'LOTE_NAO_ENCONTRADO',
    'QUANTIDADE_CESTAS_INSUFICIENTE',
    'AJUSTE_INVALIDO',
    'SALDO_INSUFICIENTE',
    'RECURSO_OCUPADO',
    'CONCORRENCIA_REPETIR',
  ])('traduz %s sem detalhes internos', (code) => {
    const message = userErrorMessage(
      new HttpErrorResponse({ status: 409, error: { error: { code, message: 'SQL secreto' } } }),
    );
    expect(message).toBeTruthy();
    expect(message).not.toContain('SQL');
    expect(message).not.toContain(code);
  });
});
