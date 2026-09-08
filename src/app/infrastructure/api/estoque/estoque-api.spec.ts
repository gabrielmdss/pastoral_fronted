import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EstoqueApiService } from './estoque-api.service';
import { APP_CONFIG } from '../../config/app-config';
import { mapInsumo } from './estoque-api.mapper';
const insumo = {
  apresentacaoId: '8',
  insumoId: '2',
  insumo: 'Arroz',
  apresentacao: '1 kg',
  categoria: null,
  quantidadeReferencia: 1,
  unidadeMedida: 'kg',
  saldoFisico: 10,
  saldoReservado: 8,
  saldoDisponivel: 2,
};
describe('Estoque HTTP', () => {
  let api: EstoqueApiService, http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        EstoqueApiService,
        { provide: APP_CONFIG, useValue: { apiBaseUrl: '/api' } },
      ],
    });
    api = TestBed.inject(EstoqueApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('preserva saldos e consulta por apresentação sem filtros inventados', () => {
    expect(mapInsumo(insumo)).toEqual(insumo);
    api.listar().subscribe((data) => expect(data).toEqual([insumo]));
    http.expectOne('/api/estoque/insumos').flush({ data: [insumo] });
    api.obter('8').subscribe((data) => expect(data).toEqual(insumo));
    http.expectOne('/api/estoque/insumos/8').flush({ data: insumo });
    api.obter('9').subscribe((data) => expect(data).toBeNull());
    http.expectOne('/api/estoque/insumos/9').flush({ data: null });
  });
  it('envia entrada e perda exatamente no contrato', () => {
    const entrada = {
      tipo: 'DOACAO' as const,
      doadorId: null,
      dataEntrada: null,
      observacao: null,
      itens: [{ apresentacaoInsumoId: '8', quantidade: 2, validade: null }],
    };
    api.entrada(entrada).subscribe((r) => expect(r.id).toBe('10'));
    const req = http.expectOne('/api/estoque/entradas');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(entrada);
    req.flush({ data: { id: '10' } }, { status: 201, statusText: 'Created' });
    const perda = { apresentacaoInsumoId: '8', quantidade: 1, motivoId: '3', observacao: null };
    api.perda(perda).subscribe();
    const p = http.expectOne('/api/estoque/perdas');
    expect(p.request.body).toEqual(perda);
    p.flush({ data: { id: '11' } });
  });
  it('consulta categorias e doadores e cadastra insumo/doador', () => {
    api.categorias().subscribe();
    http.expectOne('/api/estoque/categorias-prioridade').flush({ data: [] });
    api.doadores().subscribe();
    http.expectOne('/api/doadores').flush({ data: [] });
    const input = {
      nome: 'Arroz',
      categoriaPrioridadeId: null,
      apresentacao: { descricao: '1 kg', quantidadeReferencia: 1, unidadeMedida: 'kg' },
    };
    api.cadastrar(input).subscribe();
    const r = http.expectOne('/api/estoque/insumos');
    expect(r.request.body).toEqual(input);
    r.flush({ data: { id: '2', apresentacaoId: '8' } });
    const d = { tipo: 'PESSOA' as const, nome: 'Ana', telefone: null, observacao: null };
    api.criarDoador(d).subscribe();
    const c = http.expectOne('/api/doadores');
    expect(c.request.body).toEqual(d);
    c.flush({ data: { id: '1' } });
    api.atualizarDoador('1', { ...d, ativo: false }).subscribe();
    const u = http.expectOne('/api/doadores/1');
    expect(u.request.method).toBe('PUT');
    expect(u.request.body).toEqual({ ...d, ativo: false });
    u.flush(null, { status: 204, statusText: 'No Content' });
  });
});
