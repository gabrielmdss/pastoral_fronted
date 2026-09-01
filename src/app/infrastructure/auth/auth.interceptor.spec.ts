import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SESSION_STORAGE } from '../../application/auth/ports/session-storage.port';
import { APP_CONFIG } from '../config/app-config';
import { authInterceptor } from './auth.interceptor';
import { HttpClient } from '@angular/common/http';
describe('authInterceptor', () => {
  let client: HttpClient, http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { apiBaseUrl: 'http://api.test/api/v1' } },
        {
          provide: SESSION_STORAGE,
          useValue: {
            getAccessToken: () => 'jwt',
            setAccessToken: () => undefined,
            clear: () => undefined,
          },
        },
      ],
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('adiciona Bearer somente à API configurada', () => {
    client.get('http://api.test/api/v1/auth/me').subscribe();
    expect(
      http.expectOne('http://api.test/api/v1/auth/me').request.headers.get('Authorization'),
    ).toBe('Bearer jwt');
    client.get('/config.json').subscribe();
    expect(http.expectOne('/config.json').request.headers.has('Authorization')).toBe(false);
  });
});
