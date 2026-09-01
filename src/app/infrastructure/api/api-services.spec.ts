import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, afterEach, expect, it } from 'vitest';
import { AuthApiService } from './auth/auth-api.service';
import { DashboardApiService } from './dashboard/dashboard-api.service';
import { APP_CONFIG } from '../config/app-config';
describe('API services', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthApiService,
        DashboardApiService,
        { provide: APP_CONFIG, useValue: { apiBaseUrl: 'http://localhost:3000/api/v1' } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('usa contratos e URLs reais de login e me', () => {
    const auth = TestBed.inject(AuthApiService);
    auth.login({ login: 'admin', senha: 'x' }).subscribe();
    const login = http.expectOne('http://localhost:3000/api/v1/auth/login');
    expect(login.request.method).toBe('POST');
    expect(login.request.body).toEqual({ login: 'admin', senha: 'x' });
    login.flush({
      data: {
        accessToken: 't',
        usuario: { id: '1', login: 'admin', ativo: true, perfis: [], permissoes: [] },
      },
    });
    auth.me().subscribe();
    expect(http.expectOne('http://localhost:3000/api/v1/auth/me').request.method).toBe('GET');
  });
  it('consulta somente GET /dashboard', () => {
    TestBed.inject(DashboardApiService).get().subscribe();
    expect(http.expectOne('http://localhost:3000/api/v1/dashboard').request.method).toBe('GET');
  });
});
