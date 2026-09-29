import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { APP_CONFIG } from '../../config/app-config';
import { UsuariosApiService } from './usuarios-api.service';
describe('Usuarios HTTP', () => {
  let api: UsuariosApiService, http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        UsuariosApiService,
        { provide: APP_CONFIG, useValue: { apiBaseUrl: '/api' } },
      ],
    });
    api = TestBed.inject(UsuariosApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('lista perfis ativos em GET /admin/perfis', () => {
    const perfis = [{ id: '1', codigo: 'ADMINISTRADOR', nome: 'Administrador' }];
    api.listarPerfis().subscribe((r) => expect(r).toEqual(perfis));
    const req = http.expectOne('/api/admin/perfis');
    expect(req.request.method).toBe('GET');
    req.flush({ data: perfis });
  });
  it('cria usuário em POST /admin/usuarios com login sem espaços nas pontas', () => {
    api
      .criar({ login: '  maria ', senha: 'segredo123', perfilIds: ['2', '4'] })
      .subscribe((r) => expect(r).toEqual({ id: '9', login: 'maria', perfis: ['ATENDIMENTO', 'ESTOQUE'] }));
    const req = http.expectOne('/api/admin/usuarios');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ login: 'maria', senha: 'segredo123', perfilIds: ['2', '4'] });
    req.flush({ data: { id: '9', login: 'maria', perfis: ['ATENDIMENTO', 'ESTOQUE'] } }, { status: 201, statusText: 'Created' });
  });
});
