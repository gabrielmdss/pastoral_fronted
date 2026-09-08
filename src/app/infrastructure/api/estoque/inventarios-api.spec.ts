import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { APP_CONFIG } from '../../config/app-config';
import { InventariosApiService } from './inventarios-api.service';
import { INVENTARIOS_API } from '../../../application/estoque/inventarios-api.port';
import * as U from '../../../application/estoque/inventarios.use-cases';
import { mapInventario } from './inventarios-api.mapper';
import type { InventarioDto } from './inventarios-api.contracts';
import { userErrorMessage } from '../../../shared/errors/user-error';
const dto: InventarioDto = {
  id: '1',
  status: 'ABERTO',
  usuario_responsavel_id: '2',
  iniciado_em: '2026-09-07T12:00:00Z',
  concluido_em: null,
  iniciadoEm: '2026-09-07T12:00:00Z',
  concluidoEm: null,
  itens: [
    {
      apresentacaoId: '3',
      insumo: 'Arroz',
      apresentacao: '1 kg',
      saldoSistema: 10,
      saldoFisico: 7,
      diferenca: -3,
    },
  ],
};
describe('Inventário: contratos executáveis', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        InventariosApiService,
        ...Object.values(U),
        { provide: INVENTARIOS_API, useExisting: InventariosApiService },
        { provide: APP_CONFIG, useValue: { apiBaseUrl: '/api' } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });
  it.each(['ABERTO', 'CONCLUIDO', 'CANCELADO'] as const)(
    'mapper preserva estado %s e divergência autoritativa',
    (status) => {
      const mapped = mapInventario({
        ...dto,
        status,
        itens: [{ ...dto.itens[0]!, diferenca: -8 }],
      });
      expect(mapped.status).toBe(status);
      expect(mapped.usuarioResponsavelId).toBe('2');
      expect(mapped.concluidoEm).toBeNull();
      expect(mapped.itens[0]?.diferenca).toBe(-8);
      expect(mapped.itens).not.toBe(dto.itens);
    },
  );
  it('cria sem campos com 201 e recebe ID; não solicita listagem inexistente', () => {
    TestBed.inject(U.CriarInventarioUseCase)
      .execute()
      .subscribe((x) => expect(x.id).toBe('1'));
    const r = http.expectOne('/api/estoque/inventarios');
    expect(r.request.method).toBe('POST');
    expect(r.request.body).toEqual({});
    r.flush({ data: { id: '1' } }, { status: 201, statusText: 'Created' });
  });
  it('consulta detalhe e aceita data null', () => {
    TestBed.inject(U.ObterInventarioUseCase)
      .execute('1')
      .subscribe((x) => expect(x).toEqual(mapInventario(dto)));
    http.expectOne('/api/estoque/inventarios/1').flush({ data: dto });
    TestBed.inject(U.ObterInventarioUseCase)
      .execute('9')
      .subscribe((x) => expect(x).toBeNull());
    http.expectOne('/api/estoque/inventarios/9').flush({ data: null });
  });
  it('contagem usa PUT, saldoFisico zero e 204', () => {
    TestBed.inject(U.ContarInventarioUseCase).execute('1', '3', 0).subscribe();
    const r = http.expectOne('/api/estoque/inventarios/1/itens/3');
    expect(r.request.method).toBe('PUT');
    expect(r.request.body).toEqual({ saldoFisico: 0 });
    r.flush(null, { status: 204, statusText: 'No Content' });
  });
  it('conclui via POST vazio com 204', () => {
    TestBed.inject(U.ConcluirInventarioUseCase).execute('1').subscribe();
    const r = http.expectOne('/api/estoque/inventarios/1/concluir');
    expect(r.request.method).toBe('POST');
    expect(r.request.body).toEqual({});
    r.flush(null, { status: 204, statusText: 'No Content' });
  });
  it.each([
    'INVENTARIO_DESATUALIZADO',
    'INVENTARIO_ITEM_NAO_ENCONTRADO',
    'INVENTARIO_INVALIDO',
    'CONCORRENCIA_REPETIR',
    'RECURSO_OCUPADO',
    'PERMISSAO_NEGADA',
  ])('traduz %s sem SQL', (code) => {
    const message = userErrorMessage(
      new HttpErrorResponse({ status: 409, error: { error: { code, message: 'SQL privado' } } }),
    );
    expect(message).not.toContain('SQL');
    expect(message).not.toContain(code);
    expect(message).toBeTruthy();
  });
});
